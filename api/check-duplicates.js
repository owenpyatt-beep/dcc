// Check extracted invoices against existing database for duplicates
// POST /api/check-duplicates  { invoices: [{ vendor, invoiceNumber, amountDue }, ...] }
//
// Returns each invoice with a duplicate flag and reference to the original draw

import { supabaseAdmin } from "./_supabase.js";

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

// Fuzzy invoice number matching — catches typos like "31368" vs "313638"
function isFuzzyMatch(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Substring match (one contains the other)
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const { invoices } = req.body;
  if (!Array.isArray(invoices)) return res.status(400).json({ error: "invoices array required" });

  try {
    // Pull all existing invoices with draw info
    const { data: existing, error } = await supabaseAdmin
      .from("invoices")
      .select("id, vendor, invoice_number, amount_due, draw_id, property_id");

    if (error) throw error;

    const { data: draws } = await supabaseAdmin.from("draws").select("id, num, property_id");
    const { data: props } = await supabaseAdmin.from("properties").select("id, name, short_name");

    const drawLookup = Object.fromEntries(draws.map((d) => [d.id, d]));
    const propLookup = Object.fromEntries(props.map((p) => [p.id, p]));

    const checked = invoices.map((inv) => {
      const vendorN = normalize(inv.vendor);

      // Find matches by vendor + invoice number
      const matches = existing.filter((e) => {
        if (normalize(e.vendor) !== vendorN) return false;
        return isFuzzyMatch(e.invoice_number, inv.invoiceNumber);
      });

      if (matches.length === 0) {
        return { ...inv, duplicate: false };
      }

      const dupRefs = matches.map((m) => {
        const draw = drawLookup[m.draw_id];
        const prop = propLookup[m.property_id];
        return {
          drawNum: draw?.num,
          property: prop?.short_name || "Unknown",
          amount: parseFloat(m.amount_due),
          invoiceNumber: m.invoice_number,
          exact: normalize(m.invoice_number) === normalize(inv.invoiceNumber),
        };
      });

      // Check if amount matches — if different, might be partial payment
      const amountMatch = matches.some(
        (m) => Math.abs(parseFloat(m.amount_due) - inv.amountDue) < 0.01
      );

      return {
        ...inv,
        duplicate: true,
        duplicateExact: matches.some((m) => normalize(m.invoice_number) === normalize(inv.invoiceNumber)),
        duplicateAmountMatches: amountMatch,
        duplicateRefs: dupRefs,
      };
    });

    const summary = {
      total: checked.length,
      duplicates: checked.filter((i) => i.duplicate).length,
      exactMatches: checked.filter((i) => i.duplicateExact).length,
      amountMismatches: checked.filter((i) => i.duplicate && !i.duplicateAmountMatches).length,
    };

    return res.status(200).json({ ok: true, invoices: checked, summary });
  } catch (err) {
    console.error("Dedup error:", err);
    return res.status(500).json({ error: err.message });
  }
}
