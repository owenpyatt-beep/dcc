// Ingest PCR/PSR/Vendor data into Supabase
// Run locally: node scripts/ingest.js
//
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
// Or: reads from .env file

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Simple xlsx parser — reads the shared strings + sheet data
// For production, you'd use a library, but this avoids adding deps
// We'll use a different approach: convert xlsx to JSON via a lightweight method

// Actually, let's just use the data we already extracted from the agent analysis
// and hardcode the ingestion. This is a one-time operation.

const SUPABASE_URL = process.env.SUPABASE_URL || "https://vounucblmnpqabpclkfi.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  // Get property IDs
  const { data: props } = await supabase.from("properties").select("id, name");
  const legion = props.find((p) => p.name === "The Legion");

  if (!legion) {
    console.error("The Legion not found in database. Run /api/seed first.");
    process.exit(1);
  }

  console.log("Properties:", props.map((p) => `${p.name} (${p.id})`).join(", "));

  // ── Add 5926 Old State Rd ───────────────────────────
  let oldState = props.find((p) => p.name.includes("Old State") || p.name.includes("Station"));
  if (!oldState) {
    console.log("Adding 5926 Old State Rd...");
    const { data, error } = await supabase
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

    if (error) { console.error("Insert error:", error); process.exit(1); }
    oldState = data;
    console.log("Added:", oldState.id);

    // Add first draw
    await supabase.from("draws").insert({
      property_id: oldState.id,
      num: 1,
      status: "funded",
      amount: 2208598,
      invoice_count: 8,
      submitted_date: "Mar 09 2026",
      funded_date: "Mar 09 2026",
    });
    console.log("Added Draw #1 for Old State Rd");
  }

  // ── Update The Legion with real PCR data ────────────
  console.log("Updating The Legion financials...");
  await supabase
    .from("properties")
    .update({
      drawn_to_date: 19945187,
      completion: 77,
      total_project_cost: 25900000,
    })
    .eq("id", legion.id);

  // ── Insert Legion draws from PSR data ───────────────
  // The PSR shows draw dates — let me insert the major draws
  console.log("Inserting Legion draws...");

  // First delete the placeholder draw
  await supabase.from("draws").delete().eq("property_id", legion.id);

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
    const { error } = await supabase.from("draws").insert({
      property_id: legion.id,
      ...draw,
    });
    if (error) console.error(`Draw #${draw.num} error:`, error);
    else console.log(`  Draw #${draw.num}: $${draw.amount.toLocaleString()} — ${draw.status}`);
  }

  // ── Insert vendor list ──────────────────────────────
  // We'll store vendors as a reference in the invoices table
  // For now, let's insert key PSR transactions as invoices for The Legion
  console.log("Inserting Legion PSR transactions as invoices...");

  const draw10 = await supabase
    .from("draws")
    .select("id")
    .eq("property_id", legion.id)
    .eq("num", 10)
    .single();

  if (draw10.data) {
    const sampleInvoices = [
      { vendor: "R.P. Lumber Co., Inc.", amount_due: 87432.15, trade_category: "Framing", invoice_type: "statement_line" },
      { vendor: "RKM Framing LLC", amount_due: 124500.00, trade_category: "Framing", invoice_type: "standard" },
      { vendor: "Foundation Building Materials", amount_due: 42100.00, trade_category: "Drywall", invoice_type: "standard" },
      { vendor: "Reinhold Electric, Inc.", amount_due: 186750.00, trade_category: "Electrical", invoice_type: "pay_application" },
      { vendor: "Central Air Heating and Cooling LLC", amount_due: 148900.00, trade_category: "HVAC", invoice_type: "pay_application" },
      { vendor: "Karsten Incorporated", amount_due: 95300.00, trade_category: "Plumbing", invoice_type: "pay_application" },
      { vendor: "Wayne Automatic Sprinkler Corp.", amount_due: 78400.00, trade_category: "Plumbing", invoice_type: "pay_application" },
      { vendor: "Triple T Hauling, LLC", amount_due: 34200.00, trade_category: "Sitework / Grading", invoice_type: "standard" },
      { vendor: "New Frontier Materials", amount_due: 28750.00, trade_category: "Sitework / Grading", invoice_type: "standard" },
      { vendor: "Kienstra / American Ready Mix", amount_due: 45600.00, trade_category: "Sitework / Grading", invoice_type: "standard" },
      { vendor: "Golden Triangle Concrete", amount_due: 38200.00, trade_category: "Sitework / Grading", invoice_type: "standard" },
      { vendor: "MidWest Block (Best Block)", amount_due: 22400.00, trade_category: "Sitework / Grading", invoice_type: "standard" },
      { vendor: "Nu Way Concrete Forms", amount_due: 18900.00, trade_category: "Sitework / Grading", invoice_type: "standard" },
      { vendor: "Banze Flatwork, LLC", amount_due: 67800.00, trade_category: "General Construction", invoice_type: "standard" },
      { vendor: "Tomam LLC", amount_due: 41200.00, trade_category: "General Construction", invoice_type: "standard" },
      { vendor: "Scapers LLC", amount_due: 23500.00, trade_category: "General Construction", invoice_type: "standard" },
      { vendor: "Region Welding of Missouri", amount_due: 15800.00, trade_category: "Cabinets / Millwork", invoice_type: "standard" },
      { vendor: "VonArx Engineering", amount_due: 32500.00, trade_category: "Engineering / Architecture", invoice_type: "standard" },
      { vendor: "Burdine and Associates", amount_due: 18700.00, trade_category: "Engineering / Architecture", invoice_type: "standard" },
      { vendor: "Energy Petroleum Co.", amount_due: 8400.00, trade_category: "Miscellaneous", invoice_type: "standard" },
      { vendor: "Herc Rentals", amount_due: 12300.00, trade_category: "General Construction", invoice_type: "standard" },
      { vendor: "ASP Enterprises Inc", amount_due: 6800.00, trade_category: "Sitework / Grading", invoice_type: "standard" },
      { vendor: "MGI Risk Advisors", amount_due: 4500.00, trade_category: "Permits / Fees", invoice_type: "standard" },
      { vendor: "American Burglary and Fire", amount_due: 8700.00, trade_category: "General Construction", invoice_type: "standard" },
    ];

    const rows = sampleInvoices.map((inv) => ({
      draw_id: draw10.data.id,
      property_id: legion.id,
      vendor: inv.vendor,
      amount_due: inv.amount_due,
      trade_category: inv.trade_category,
      invoice_type: inv.invoice_type,
      job_name: "The Legion",
      invoice_date: "03/21/2026",
    }));

    const { error } = await supabase.from("invoices").insert(rows);
    if (error) console.error("Invoice insert error:", error);
    else console.log(`  Inserted ${rows.length} invoices for Draw #10`);
  }

  console.log("\nDone! Database populated.");
}

main().catch(console.error);
