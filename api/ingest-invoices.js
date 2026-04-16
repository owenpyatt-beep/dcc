// Ingest all invoice line items from the 12 real TLA draws
// GET /api/ingest-invoices
//
// Replaces the 258 PSR-derived invoices with 600+ real line-item data

import { supabaseAdmin } from "./_supabase.js";
import { DRAW_INVOICES } from "./_invoices-data.js";

export default async function handler(req, res) {
  try {
    const { data: props } = await supabaseAdmin.from("properties").select("id, name");
    const legion = props.find((p) => p.name === "The Legion");
    if (!legion) return res.status(400).json({ error: "Legion not found" });

    // Get all Legion draws by number
    const { data: draws } = await supabaseAdmin
      .from("draws")
      .select("id, num")
      .eq("property_id", legion.id);
    const drawByNum = Object.fromEntries(draws.map((d) => [d.num, d.id]));

    // Wipe existing invoices
    await supabaseAdmin.from("invoices").delete().eq("property_id", legion.id);

    const results = [];
    let totalInvoices = 0;
    let totalAmount = 0;

    // Insert invoices for each draw
    for (const [drawNum, invoices] of Object.entries(DRAW_INVOICES)) {
      const drawId = drawByNum[parseInt(drawNum, 10)];
      if (!drawId) continue;

      const rows = invoices.map((inv) => ({
        draw_id: drawId,
        property_id: legion.id,
        vendor: inv.vendor,
        invoice_number: inv.inv || null,
        amount_due: inv.amt,
        job_name: "The Legion",
        trade_category: "General Construction", // will be updated by /api/categorize
        invoice_type: "standard",
      }));

      // Insert in chunks of 50
      for (let i = 0; i < rows.length; i += 50) {
        const chunk = rows.slice(i, i + 50);
        const { error } = await supabaseAdmin.from("invoices").insert(chunk);
        if (error) throw new Error(`Draw #${drawNum} chunk ${i}: ${error.message}`);
      }

      // Update draw invoice count
      await supabaseAdmin
        .from("draws")
        .update({ invoice_count: invoices.length })
        .eq("id", drawId);

      const drawTotal = invoices.reduce((s, i) => s + i.amt, 0);
      totalInvoices += invoices.length;
      totalAmount += drawTotal;
      results.push(`Draw #${drawNum}: ${invoices.length} invoices, $${drawTotal.toLocaleString()}`);
    }

    results.push(`TOTAL: ${totalInvoices} invoices, $${totalAmount.toLocaleString()}`);

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error("Ingest invoices error:", err);
    return res.status(500).json({ error: err.message });
  }
}
