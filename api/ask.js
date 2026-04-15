// Natural language search across all Debrecht Properties data
// POST /api/ask  { question: "how much have we paid Reinhold Electric?" }
//
// Pulls relevant data from Supabase, sends to Claude with the question,
// returns a natural language answer.

import { supabaseAdmin } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST required" });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "question is required" });
  }

  const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: "Anthropic API key not configured" });
  }

  try {
    // Pull all data from Supabase
    const [propsRes, drawsRes, invoicesRes] = await Promise.all([
      supabaseAdmin.from("properties").select("*"),
      supabaseAdmin.from("draws").select("*").order("num"),
      supabaseAdmin.from("invoices").select("*").order("invoice_date"),
    ]);

    if (propsRes.error) throw propsRes.error;
    if (drawsRes.error) throw drawsRes.error;
    if (invoicesRes.error) throw invoicesRes.error;

    // Build vendor summary
    const vendorTotals = {};
    for (const inv of invoicesRes.data) {
      const key = inv.vendor;
      if (!vendorTotals[key]) {
        vendorTotals[key] = { vendor: key, totalPaid: 0, transactionCount: 0, properties: new Set(), dates: [] };
      }
      vendorTotals[key].totalPaid += parseFloat(inv.amount_due) || 0;
      vendorTotals[key].transactionCount++;
      const prop = propsRes.data.find((p) => p.id === inv.property_id);
      if (prop) vendorTotals[key].properties.add(prop.name);
      if (inv.invoice_date) vendorTotals[key].dates.push(inv.invoice_date);
    }

    const vendorSummary = Object.values(vendorTotals)
      .map((v) => ({
        vendor: v.vendor,
        totalPaid: v.totalPaid.toFixed(2),
        transactions: v.transactionCount,
        properties: [...v.properties].join(", "),
        dateRange: v.dates.length > 0 ? `${v.dates[0]} to ${v.dates[v.dates.length - 1]}` : "N/A",
      }))
      .sort((a, b) => parseFloat(b.totalPaid) - parseFloat(a.totalPaid));

    // Build property summary
    const propertySummary = propsRes.data.map((p) => ({
      name: p.name,
      category: p.category,
      address: p.address,
      ...(p.category === "build"
        ? {
            totalProjectCost: p.total_project_cost,
            loanAmount: p.loan_amount,
            drawnToDate: p.drawn_to_date,
            completion: p.completion + "%",
            drawCount: drawsRes.data.filter((d) => d.property_id === p.id).length,
          }
        : {
            totalUnits: p.total_units,
            occupiedUnits: p.occupied_units,
            occupancy: p.total_units > 0 ? Math.round((p.occupied_units / p.total_units) * 100) + "%" : "N/A",
            monthlyIncome: p.monthly_income,
            delinquent: (p.delinquent_30 || 0) + (p.delinquent_60 || 0) + " units",
          }),
    }));

    // Build context for Claude
    const context = `You are the Debrecht Command Center AI assistant. You answer questions about Debrecht Properties' construction projects and managed properties.

## Properties
${JSON.stringify(propertySummary, null, 2)}

## Vendor Payment Summary (${vendorSummary.length} vendors, ${invoicesRes.data.length} total transactions)
${JSON.stringify(vendorSummary, null, 2)}

## All Transactions (${invoicesRes.data.length} records)
${invoicesRes.data.map((inv) => {
  const prop = propsRes.data.find((p) => p.id === inv.property_id);
  return `${inv.invoice_date} | ${prop?.name || "Unknown"} | ${inv.vendor} | $${parseFloat(inv.amount_due).toLocaleString()} | ${inv.trade_category || ""}`;
}).join("\n")}

## Draws
${drawsRes.data.map((d) => {
  const prop = propsRes.data.find((p) => p.id === d.property_id);
  return `${prop?.name || "Unknown"} Draw #${d.num}: $${parseFloat(d.amount).toLocaleString()} — ${d.status} ${d.funded_date ? "(funded " + d.funded_date + ")" : ""}`;
}).join("\n")}

Answer the user's question using ONLY the data above. Format dollar amounts with commas. Be specific and include numbers. If you're showing multiple items, use a clean list format. Keep answers concise but complete.`;

    // Call Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          { role: "user", content: question },
        ],
        system: context,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Claude API error ${response.status}`);
    }

    const data = await response.json();
    const answer = data.content[0].text;

    return res.status(200).json({
      ok: true,
      answer,
      meta: {
        propertiesSearched: propsRes.data.length,
        transactionsSearched: invoicesRes.data.length,
        vendorsFound: vendorSummary.length,
      },
    });
  } catch (err) {
    console.error("Ask error:", err);
    return res.status(500).json({ error: err.message });
  }
}
