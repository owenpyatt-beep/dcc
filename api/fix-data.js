// Data accuracy fix — corrects Station totals and Legion vendor sum
// GET /api/fix-data

import { supabaseAdmin } from "./_supabase.js";

export default async function handler(req, res) {
  try {
    const { data: props } = await supabaseAdmin.from("properties").select("id, name");
    const legion = props.find((p) => p.name === "The Legion");
    const station = props.find((p) => p.name === "The Station");

    if (!legion || !station) return res.status(400).json({ error: "Properties not found" });

    const results = [];

    // ── Add missing Station transactions (CLOSING DRAW, PAID FROM EQUITY) ──
    const { data: stationDraw } = await supabaseAdmin
      .from("draws")
      .select("id")
      .eq("property_id", station.id)
      .eq("num", 1)
      .single();

    if (stationDraw) {
      // Check if they're already there
      const { data: existing } = await supabaseAdmin
        .from("invoices")
        .select("vendor")
        .eq("property_id", station.id);

      const vendors = new Set((existing || []).map((i) => i.vendor.toLowerCase()));

      const missingTxns = [];
      if (!vendors.has("closing draw")) {
        missingTxns.push({
          draw_id: stationDraw.id,
          property_id: station.id,
          vendor: "Closing Draw",
          amount_due: 1184911.80,
          invoice_date: "2026-03-09",
          job_name: "The Station",
          trade_category: "General Construction",
          invoice_type: "standard",
        });
      }
      if (!vendors.has("paid from equity")) {
        missingTxns.push({
          draw_id: stationDraw.id,
          property_id: station.id,
          vendor: "Paid From Equity",
          amount_due: 642562.50,
          invoice_date: "2026-03-09",
          job_name: "The Station",
          trade_category: "General Construction",
          invoice_type: "standard",
        });
      }

      if (missingTxns.length > 0) {
        await supabaseAdmin.from("invoices").insert(missingTxns);
        results.push(`Added ${missingTxns.length} missing Station transactions ($1,827,474)`);
      } else {
        results.push("Station transactions already complete");
      }

      // Update draw #1 total and count
      const { data: allStationInvoices } = await supabaseAdmin
        .from("invoices")
        .select("amount_due")
        .eq("property_id", station.id);

      const stationTotal = allStationInvoices.reduce((s, i) => s + parseFloat(i.amount_due), 0);

      await supabaseAdmin
        .from("draws")
        .update({
          amount: stationTotal,
          invoice_count: allStationInvoices.length,
        })
        .eq("id", stationDraw.id);

      await supabaseAdmin
        .from("properties")
        .update({ drawn_to_date: stationTotal })
        .eq("id", station.id);

      results.push(`Station total: $${stationTotal.toLocaleString()}, ${allStationInvoices.length} transactions`);
    }

    // ── Fix Legion totals to match actual invoice sum ──
    const { data: allLegionInvoices } = await supabaseAdmin
      .from("invoices")
      .select("amount_due")
      .eq("property_id", legion.id);

    const legionTotal = allLegionInvoices.reduce((s, i) => s + parseFloat(i.amount_due), 0);

    await supabaseAdmin
      .from("properties")
      .update({ drawn_to_date: legionTotal })
      .eq("id", legion.id);

    results.push(`Legion total: $${legionTotal.toLocaleString()}, ${allLegionInvoices.length} transactions`);

    // ── Recompute Legion draw amounts based on transaction dates ──
    // Group transactions by date clusters
    const { data: legionInvoicesFull } = await supabaseAdmin
      .from("invoices")
      .select("amount_due, invoice_date")
      .eq("property_id", legion.id)
      .order("invoice_date");

    // Draw periods from PSR
    const drawPeriods = [
      { num: 1, start: "2025-03-01", end: "2025-03-31", submitted: "Mar 10 2025", funded: "Mar 24 2025" },
      { num: 2, start: "2025-04-01", end: "2025-04-30", submitted: "Apr 14 2025", funded: "Apr 28 2025" },
      { num: 3, start: "2025-05-01", end: "2025-05-31", submitted: "May 12 2025", funded: "May 28 2025" },
      { num: 4, start: "2025-06-01", end: "2025-07-31", submitted: "Jun 16 2025", funded: "Jun 24 2025" },
      { num: 5, start: "2025-08-01", end: "2025-08-15", submitted: "Jul 14 2025", funded: "Aug 01 2025" },
      { num: 6, start: "2025-08-16", end: "2025-09-30", submitted: "Aug 20 2025", funded: "Aug 27 2025" },
      { num: 7, start: "2025-10-01", end: "2025-11-30", submitted: "Oct 15 2025", funded: "Oct 23 2025" },
      { num: 8, start: "2025-12-01", end: "2025-12-20", submitted: "Dec 01 2025", funded: "Dec 10 2025" },
      { num: 9, start: "2025-12-21", end: "2026-01-31", submitted: "Dec 20 2025", funded: "Dec 26 2025" },
      { num: 10, start: "2026-02-01", end: "2026-04-30", submitted: "Feb 20 2026", funded: "Mar 30 2026" },
    ];

    // Calculate actual draw totals
    const drawTotals = drawPeriods.map((p) => {
      const txns = legionInvoicesFull.filter((t) => t.invoice_date >= p.start && t.invoice_date <= p.end);
      const amount = txns.reduce((s, t) => s + parseFloat(t.amount_due), 0);
      return { ...p, amount, count: txns.length };
    });

    // Delete existing Legion draws and recreate with accurate amounts
    await supabaseAdmin.from("draws").delete().eq("property_id", legion.id);

    for (const d of drawTotals) {
      await supabaseAdmin.from("draws").insert({
        property_id: legion.id,
        num: d.num,
        status: "funded",
        amount: d.amount,
        invoice_count: d.count,
        submitted_date: d.submitted,
        funded_date: d.funded,
      });
    }

    // Link invoices to draws by date range
    for (const d of drawTotals) {
      const { data: drawRow } = await supabaseAdmin
        .from("draws")
        .select("id")
        .eq("property_id", legion.id)
        .eq("num", d.num)
        .single();

      if (drawRow) {
        await supabaseAdmin
          .from("invoices")
          .update({ draw_id: drawRow.id })
          .eq("property_id", legion.id)
          .gte("invoice_date", d.start)
          .lte("invoice_date", d.end);
      }
    }

    const totalOfDraws = drawTotals.reduce((s, d) => s + d.amount, 0);
    results.push(`Legion draws recomputed — ${drawTotals.length} draws, $${totalOfDraws.toLocaleString()}`);
    drawTotals.forEach((d) => {
      results.push(`  Draw #${d.num}: $${d.amount.toLocaleString()} (${d.count} invoices) ${d.start} to ${d.end}`);
    });

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error("Fix-data error:", err);
    return res.status(500).json({ error: err.message });
  }
}
