// Twilio SMS webhook — receives texts, queries DCC data, responds via AI
// POST /api/sms (Twilio sends form-encoded data)
//
// Twilio config: set webhook URL to https://dcc-rosy.vercel.app/api/sms

import { supabaseAdmin } from "./_supabase.js";

const INTERNAL_GC_VENDORS = ["ljld llc", "ljld"];
const isInternalGC = (v) =>
  INTERNAL_GC_VENDORS.includes(
    String(v || "").toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim()
  );

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("POST required");
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_ANTHROPIC_API_KEY;
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;

  // Parse incoming SMS (Twilio sends form-encoded)
  const from = req.body.From;
  const question = req.body.Body;

  if (!question) {
    return respondTwiml(res, "Send me a question about Debrecht Properties.");
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
        vendorTotals[key] = { vendor: key, totalPaid: 0, count: 0, properties: new Set() };
      }
      vendorTotals[key].totalPaid += parseFloat(inv.amount_due) || 0;
      vendorTotals[key].count++;
      const prop = propsRes.data.find((p) => p.id === inv.property_id);
      if (prop) vendorTotals[key].properties.add(prop.name);
    }

    const vendorSummary = Object.values(vendorTotals)
      .map((v) => {
        const tag = isInternalGC(v.vendor) ? " [INTERNAL GC]" : "";
        return `${v.vendor}${tag}: $${v.totalPaid.toLocaleString()} (${v.count} payments, ${[...v.properties].join(", ")})`;
      })
      .join("\n");

    const propertySummary = propsRes.data.map((p) => {
      if (p.category === "build") {
        return `${p.name} (Build) — ${p.address}, $${(p.total_project_cost || 0).toLocaleString()} project, $${(p.drawn_to_date || 0).toLocaleString()} drawn, ${p.completion || 0}% complete`;
      }
      const occ = p.total_units > 0 ? Math.round((p.occupied_units / p.total_units) * 100) : 0;
      return `${p.name} (Managed) — ${p.address}, ${p.occupied_units}/${p.total_units} units (${occ}%), $${(p.monthly_income || 0).toLocaleString()}/mo income`;
    }).join("\n");

    const drawsSummary = drawsRes.data.map((d) => {
      const prop = propsRes.data.find((p) => p.id === d.property_id);
      return `${prop?.name || "?"} Draw #${d.num}: $${parseFloat(d.amount).toLocaleString()} — ${d.status}${d.funded_date ? " (funded " + d.funded_date + ")" : ""}`;
    }).join("\n");

    const context = `You are the Debrecht Command Center SMS assistant. Answer questions about Debrecht Properties concisely (SMS has a 1600 char limit). Use dollar amounts with commas. Be direct.

NOTE: LJLD LLC is Debrecht's internal GC arm (how Lorenzo's team pays themselves) — include it in totals but label it as internal, not a third-party vendor.

PROPERTIES:
${propertySummary}

VENDOR PAYMENTS (${Object.keys(vendorTotals).length} vendors, ${invoicesRes.data.length} transactions):
${vendorSummary}

DRAWS:
${drawsSummary}

TRANSACTIONS (sample — ${invoicesRes.data.length} total):
${invoicesRes.data.slice(0, 100).map((inv) => {
  const prop = propsRes.data.find((p) => p.id === inv.property_id);
  return `${inv.invoice_date} | ${prop?.name || "?"} | ${inv.vendor} | $${parseFloat(inv.amount_due).toLocaleString()}`;
}).join("\n")}

Keep response under 1500 characters for SMS delivery. No markdown formatting — plain text only.`;

    // Call Claude
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        messages: [{ role: "user", content: question }],
        system: context,
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Claude error ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    let answer = aiData.content[0].text;

    // Trim to SMS limit if needed (Twilio concatenates but keep it reasonable)
    if (answer.length > 1500) {
      answer = answer.slice(0, 1497) + "...";
    }

    // Respond via TwiML (Twilio's XML format for SMS replies)
    return respondTwiml(res, answer);
  } catch (err) {
    console.error("SMS error:", err);
    return respondTwiml(res, `Error: ${err.message}`);
  }
}

function respondTwiml(res, message) {
  res.setHeader("Content-Type", "text/xml");
  return res.status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
  );
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
