// One-time seed endpoint — inserts West Village and The Legion into Supabase
// GET /api/seed
// Safe to run multiple times — checks if data already exists

import { supabaseAdmin } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check if already seeded
    const { data: existing } = await supabaseAdmin
      .from("properties")
      .select("id")
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(200).json({ ok: true, message: "Already seeded", count: existing.length });
    }

    // ── West Village Apartments ─────────────────────────
    const { data: westVillage, error: wvErr } = await supabaseAdmin
      .from("properties")
      .insert({
        category: "managed",
        name: "West Village Apartments",
        short_name: "West Village",
        address: "986 American Legion Dr, Festus, MO 63028",
        type: "Multi-Family",
        total_units: 200,
        occupied_units: 181,
        leased_units: 195,
        delinquent_30: 5,
        delinquent_60: 0,
        delinquent_amount_30: 2373,
        delinquent_amount_60: 0,
        monthly_income: 277923,
        collected_income: 256431,
        vacant_rented: 14,
        vacant_unrented: 5,
        notice_rented: 6,
        notice_unrented: 14,
        month_rental_income: 256431,
        month_total_income: 277923,
        month_expenses: 280,
        month_noi: 278203,
        ytd_rental_income: 507466,
        ytd_total_income: 543181,
        ytd_expenses: 560,
        ytd_noi: 543741,
      })
      .select()
      .single();

    if (wvErr) throw new Error(`West Village insert failed: ${wvErr.message}`);

    // ── The Legion ──────────────────────────────────────
    const { data: legion, error: legErr } = await supabaseAdmin
      .from("properties")
      .insert({
        category: "build",
        name: "The Legion",
        short_name: "Legion",
        address: "849 American Legion Dr",
        type: "Multi-Family",
        total_project_cost: 26000000,
        loan_amount: 20800000,
        equity_required: 5200000,
        equity_in: 0,
        drawn_to_date: 0,
        completion: 0,
        pm: "Jenny",
        has_leasing: true,
        total_units: 0,
        total_buildings: 0,
        buildings_under_co: 0,
        units_ready_to_lease: 0,
      })
      .select()
      .single();

    if (legErr) throw new Error(`Legion insert failed: ${legErr.message}`);

    // ── Legion Draw #1 ──────────────────────────────────
    const { error: drawErr } = await supabaseAdmin
      .from("draws")
      .insert({
        property_id: legion.id,
        num: 1,
        status: "compiling",
        amount: 0,
        invoice_count: 0,
      });

    if (drawErr) throw new Error(`Draw insert failed: ${drawErr.message}`);

    return res.status(200).json({
      ok: true,
      message: "Seeded successfully",
      properties: [
        { id: westVillage.id, name: "West Village Apartments" },
        { id: legion.id, name: "The Legion" },
      ],
    });
  } catch (err) {
    console.error("Seed error:", err);
    return res.status(500).json({ error: err.message });
  }
}
