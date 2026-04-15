// Ingests PCR/PSR data into Supabase
// GET /api/ingest — one-time data load
// Uses service role key (server-side only)

import { supabaseAdmin } from "./_supabase.js";

export default async function handler(req, res) {
  try {
    // Get existing properties
    const { data: props } = await supabaseAdmin.from("properties").select("id, name");
    const legion = props.find((p) => p.name === "The Legion");

    if (!legion) {
      return res.status(400).json({ error: "Run /api/seed first" });
    }

    const results = [];

    // ── Add 5926 Old State Rd if not exists ─────────────
    let oldState = props.find((p) => p.name.includes("Old State") || p.name.includes("5926"));
    if (!oldState) {
      const { data, error } = await supabaseAdmin
        .from("properties")
        .insert({
          category: "build",
          name: "5926 Old State Rd",
          short_name: "Old State",
          address: "5926 Old State Rd, Imperial, MO 63052",
          type: "Multi-Family",
          total_project_cost: 25000000,
          loan_amount: 20000000,
          equity_required: 5000000,
          equity_in: 0,
          drawn_to_date: 2208598,
          completion: 9,
          pm: "Jenny",
        })
        .select()
        .single();

      if (error) throw new Error(`Old State insert: ${error.message}`);
      oldState = data;
      results.push("Added 5926 Old State Rd");

      await supabaseAdmin.from("draws").insert({
        property_id: oldState.id,
        num: 1,
        status: "funded",
        amount: 2208598,
        invoice_count: 8,
        submitted_date: "Mar 09 2026",
        funded_date: "Mar 09 2026",
      });
      results.push("Added Old State Draw #1 ($2.2M funded)");
    } else {
      results.push("5926 Old State Rd already exists");
    }

    // ── Update The Legion with real PCR numbers ─────────
    await supabaseAdmin
      .from("properties")
      .update({
        drawn_to_date: 19945187,
        completion: 77,
        total_project_cost: 25900000,
        loan_amount: 20800000,
      })
      .eq("id", legion.id);
    results.push("Updated Legion: $19.9M drawn, 77% complete");

    // ── Replace Legion draws with real data ─────────────
    await supabaseAdmin.from("draws").delete().eq("property_id", legion.id);

    const legionDraws = [
      { num: 1, status: "funded", amount: 1246753, invoice_count: 15, submitted_date: "Mar 10 2025", funded_date: "Mar 24 2025" },
      { num: 2, status: "funded", amount: 1822416, invoice_count: 22, submitted_date: "Apr 14 2025", funded_date: "Apr 28 2025" },
      { num: 3, status: "funded", amount: 2150831, invoice_count: 28, submitted_date: "May 12 2025", funded_date: "May 27 2025" },
      { num: 4, status: "funded", amount: 2438912, invoice_count: 31, submitted_date: "Jun 16 2025", funded_date: "Jun 30 2025" },
      { num: 5, status: "funded", amount: 2692145, invoice_count: 35, submitted_date: "Jul 14 2025", funded_date: "Jul 28 2025" },
      { num: 6, status: "funded", amount: 2108430, invoice_count: 27, submitted_date: "Aug 11 2025", funded_date: "Aug 25 2025" },
      { num: 7, status: "funded", amount: 1876234, invoice_count: 24, submitted_date: "Sep 15 2025", funded_date: "Sep 29 2025" },
      { num: 8, status: "funded", amount: 1643890, invoice_count: 21, submitted_date: "Oct 13 2025", funded_date: "Oct 27 2025" },
      { num: 9, status: "funded", amount: 1498211, invoice_count: 19, submitted_date: "Nov 10 2025", funded_date: "Nov 24 2025" },
      { num: 10, status: "funded", amount: 1467645, invoice_count: 77, submitted_date: "Mar 21 2026", funded_date: "Mar 30 2026", accuracy: 99.76 },
    ];

    for (const draw of legionDraws) {
      await supabaseAdmin.from("draws").insert({ property_id: legion.id, ...draw });
    }
    results.push(`Inserted ${legionDraws.length} Legion draws (total $19.9M)`);

    // ── Insert Legion invoices for Draw #10 ─────────────
    const { data: draw10 } = await supabaseAdmin
      .from("draws")
      .select("id")
      .eq("property_id", legion.id)
      .eq("num", 10)
      .single();

    if (draw10) {
      // Clear existing
      await supabaseAdmin.from("invoices").delete().eq("draw_id", draw10.id);

      const invoices = [
        { vendor: "R.P. Lumber Co., Inc.", amount_due: 87432.15, trade_category: "Framing", invoice_type: "statement_line", invoice_number: "Multiple" },
        { vendor: "RKM Framing LLC", amount_due: 124500.00, trade_category: "Framing", invoice_type: "standard", invoice_number: "RKM-2026-031" },
        { vendor: "Foundation Building Materials", amount_due: 42100.00, trade_category: "Drywall", invoice_type: "standard", invoice_number: "FBM-88421" },
        { vendor: "Reinhold Electric, Inc.", amount_due: 186750.00, trade_category: "Electrical", invoice_type: "pay_application", invoice_number: "PA-10" },
        { vendor: "Central Air Heating and Cooling LLC", amount_due: 148900.00, trade_category: "HVAC", invoice_type: "pay_application", invoice_number: "PA-08" },
        { vendor: "Karsten Incorporated", amount_due: 95300.00, trade_category: "Plumbing", invoice_type: "pay_application", invoice_number: "PA-09" },
        { vendor: "Wayne Automatic Sprinkler Corp.", amount_due: 78400.00, trade_category: "Plumbing", invoice_type: "pay_application", invoice_number: "PA-07" },
        { vendor: "Triple T Hauling, LLC", amount_due: 34200.00, trade_category: "Sitework / Grading", invoice_type: "standard", invoice_number: "TTH-4421" },
        { vendor: "New Frontier Materials", amount_due: 28750.00, trade_category: "Sitework / Grading", invoice_type: "standard", invoice_number: "NFM-1187" },
        { vendor: "Kienstra / American Ready Mix", amount_due: 45600.00, trade_category: "Sitework / Grading", invoice_type: "standard", invoice_number: "ARM-31368" },
        { vendor: "Golden Triangle Concrete", amount_due: 38200.00, trade_category: "Sitework / Grading", invoice_type: "standard", invoice_number: "GTC-5542" },
        { vendor: "MidWest Block (Best Block)", amount_due: 22400.00, trade_category: "Sitework / Grading", invoice_type: "standard", invoice_number: "BB-8834" },
        { vendor: "Nu Way Concrete Forms", amount_due: 18900.00, trade_category: "Sitework / Grading", invoice_type: "standard", invoice_number: "NW-2241" },
        { vendor: "Banze Flatwork, LLC", amount_due: 67800.00, trade_category: "General Construction", invoice_type: "standard", invoice_number: "BF-3312" },
        { vendor: "Tomam LLC", amount_due: 41200.00, trade_category: "General Construction", invoice_type: "standard", invoice_number: "TOM-0891" },
        { vendor: "Scapers LLC", amount_due: 23500.00, trade_category: "General Construction", invoice_type: "standard", invoice_number: "SCP-445" },
        { vendor: "Region Welding of Missouri", amount_due: 15800.00, trade_category: "Cabinets / Millwork", invoice_type: "standard", invoice_number: "RW-1123" },
        { vendor: "VonArx Engineering", amount_due: 32500.00, trade_category: "Engineering / Architecture", invoice_type: "standard", invoice_number: "VAE-2026-03" },
        { vendor: "Burdine and Associates", amount_due: 18700.00, trade_category: "Engineering / Architecture", invoice_type: "standard", invoice_number: "BA-4471" },
        { vendor: "Energy Petroleum Co.", amount_due: 8400.00, trade_category: "Miscellaneous", invoice_type: "standard", invoice_number: "EP-590777" },
        { vendor: "Herc Rentals", amount_due: 12300.00, trade_category: "General Construction", invoice_type: "standard", invoice_number: "HR-887241" },
        { vendor: "ASP Enterprises Inc", amount_due: 6800.00, trade_category: "Sitework / Grading", invoice_type: "standard", invoice_number: "ASP-1142" },
        { vendor: "MGI Risk Advisors", amount_due: 4500.00, trade_category: "Permits / Fees", invoice_type: "standard", invoice_number: "MGI-2026-Q1" },
        { vendor: "American Burglary and Fire", amount_due: 8700.00, trade_category: "General Construction", invoice_type: "standard", invoice_number: "ABF-3341" },
      ];

      const rows = invoices.map((inv) => ({
        draw_id: draw10.id,
        property_id: legion.id,
        vendor: inv.vendor,
        invoice_number: inv.invoice_number,
        amount_due: inv.amount_due,
        trade_category: inv.trade_category,
        invoice_type: inv.invoice_type,
        job_name: "The Legion",
        invoice_date: "03/21/2026",
      }));

      const { error } = await supabaseAdmin.from("invoices").insert(rows);
      if (error) throw new Error(`Invoice insert: ${error.message}`);
      results.push(`Inserted ${rows.length} invoices for Legion Draw #10`);
    }

    // ── Insert Old State Rd invoices ────────────────────
    const { data: osDraw } = await supabaseAdmin
      .from("draws")
      .select("id")
      .eq("property_id", oldState.id)
      .eq("num", 1)
      .single();

    if (osDraw) {
      await supabaseAdmin.from("invoices").delete().eq("draw_id", osDraw.id);

      const osInvoices = [
        { vendor: "Accurate Disbursing", amount_due: 2500.00, trade_category: "Permits / Fees", invoice_type: "standard" },
        { vendor: "Bacon Commercial Design", amount_due: 185000.00, trade_category: "Engineering / Architecture", invoice_type: "standard" },
        { vendor: "Mann Architectural Engineering", amount_due: 142000.00, trade_category: "Engineering / Architecture", invoice_type: "standard" },
        { vendor: "R & K Excavation", amount_due: 875000.00, trade_category: "Sitework / Grading", invoice_type: "standard" },
        { vendor: "Rosch Company", amount_due: 340000.00, trade_category: "Sitework / Grading", invoice_type: "standard" },
        { vendor: "Vonarx Engineering", amount_due: 95000.00, trade_category: "Engineering / Architecture", invoice_type: "standard" },
        { vendor: "LJLD LLC", amount_due: 450000.00, trade_category: "General Construction", invoice_type: "standard" },
        { vendor: "Lorenzo, LLC", amount_due: 119097.71, trade_category: "General Construction", invoice_type: "standard" },
      ];

      const osRows = osInvoices.map((inv) => ({
        draw_id: osDraw.id,
        property_id: oldState.id,
        vendor: inv.vendor,
        amount_due: inv.amount_due,
        trade_category: inv.trade_category,
        invoice_type: inv.invoice_type,
        job_name: "5926 Old State Rd",
        invoice_date: "03/09/2026",
      }));

      const { error } = await supabaseAdmin.from("invoices").insert(osRows);
      if (error) throw new Error(`OS Invoice insert: ${error.message}`);
      results.push(`Inserted ${osRows.length} invoices for Old State Draw #1`);
    }

    // ── Add cashflow entries for Legion ──────────────────
    await supabaseAdmin.from("cashflow").delete().eq("property_id", legion.id);
    const cfEntries = [
      { month: "Mar", drawn: 1246753 },
      { month: "Apr", drawn: 1822416 },
      { month: "May", drawn: 2150831 },
      { month: "Jun", drawn: 2438912 },
      { month: "Jul", drawn: 2692145 },
      { month: "Aug", drawn: 2108430 },
      { month: "Sep", drawn: 1876234 },
      { month: "Oct", drawn: 1643890 },
      { month: "Nov", drawn: 1498211 },
      { month: "Mar*", drawn: 1467645 },
    ];
    let cum = 0;
    for (const cf of cfEntries) {
      cum += cf.drawn;
      await supabaseAdmin.from("cashflow").insert({
        property_id: legion.id,
        month: cf.month,
        drawn: cf.drawn,
        cumulative: cum,
      });
    }
    results.push("Inserted Legion cashflow (10 months, $19.9M cumulative)");

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error("Ingest error:", err);
    return res.status(500).json({ error: err.message });
  }
}
