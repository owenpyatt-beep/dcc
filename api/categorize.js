// Categorize all invoices by vendor name
// GET /api/categorize

import { supabaseAdmin } from "./_supabase.js";

// Vendor → trade category mapping based on the verified vendor list
const VENDOR_TRADES = {
  // Electrical
  "reinhold electric": "Electrical",

  // Plumbing
  "karsten": "Plumbing",
  "karsten inc": "Plumbing",
  "karsten, inc.": "Plumbing",
  "karsten incorporated": "Plumbing",
  "wayne automatic sprinkler": "Plumbing",
  "wayne auto sprinkler": "Plumbing",
  "west county sprinklers": "Plumbing",
  "core & main": "Plumbing",

  // HVAC
  "central air heating & cooling": "HVAC",
  "central air heating and cooling llc": "HVAC",
  "central air heating & cooling, llc": "HVAC",

  // Framing
  "rkm framing": "Framing",
  "rkm framing llc": "Framing",
  "r.p. lumber": "Framing",
  "r.p. lumber co., inc.": "Framing",
  "r.p. lumber co. inc.": "Framing",
  "r. p. lumber": "Framing",
  "rp lumber": "Framing",
  "r.p. lumber (festus)": "Framing",
  "mid america truss": "Framing",
  "st. charles hardwoods": "Framing",
  "st. charles hardwoods inc.": "Framing",

  // Drywall
  "foundation building materials": "Drywall",
  "fbm": "Drywall",

  // Sitework / Grading
  "r & k excavation": "Sitework / Grading",
  "r & k excavation inc": "Sitework / Grading",
  "new frontier materials": "Sitework / Grading",
  "triple t hauling": "Sitework / Grading",
  "triple t hauling llc": "Sitework / Grading",
  "asp enterprises": "Sitework / Grading",
  "aaa zoellner materials": "Sitework / Grading",
  "aaa zoellner materials, inc.": "Sitework / Grading",
  "nu way concrete forms": "Sitework / Grading",
  "nuway concrete forms inc": "Sitework / Grading",
  "kienstra concrete": "Sitework / Grading",
  "kienstra materials": "Sitework / Grading",
  "kienstra materials co.": "Sitework / Grading",
  "kienstra concrete, inc.": "Sitework / Grading",
  "american ready mix": "Sitework / Grading",
  "golden triangle concrete": "Sitework / Grading",
  "golden triangle concrete co.": "Sitework / Grading",
  "midwest block & brick": "Sitework / Grading",
  "midwest block and brick": "Sitework / Grading",
  "o'neall's septic service": "Sitework / Grading",
  "o'neal's septic service, llc": "Sitework / Grading",
  "o'neall's septic service, llc": "Sitework / Grading",
  "jokerst paving": "Sitework / Grading",

  // Cabinets / Millwork
  "region welding": "Cabinets / Millwork",
  "region welding of missouri": "Cabinets / Millwork",
  "granite guru home services": "Cabinets / Millwork",
  "granite guru home services llc": "Cabinets / Millwork",
  "con-tech shelving & shower doors": "Cabinets / Millwork",
  "con-tech shelving & shower doors, llc": "Cabinets / Millwork",
  "con-tech building components": "Cabinets / Millwork",

  // Flooring
  "pinnacle flooring": "Flooring",
  "pinnacle flooring llc": "Flooring",

  // Insulation
  "midwest insulation": "Insulation",
  "elastizell of st louis": "Insulation",
  "elastizell of st louis inc": "Insulation",

  // Landscaping
  "heartland turf farms": "Landscaping",
  "haegele nursery": "Landscaping",
  "scapers": "Landscaping",
  "scapers llc": "Landscaping",

  // Engineering / Architecture
  "vonarx engineering": "Engineering / Architecture",
  "burdine & associates": "Engineering / Architecture",
  "burdine & associatees": "Engineering / Architecture",
  "burdine and associates": "Engineering / Architecture",
  "burdine & associates inc.": "Engineering / Architecture",
  "bacon commercial design": "Engineering / Architecture",
  "bacon commercial design llc": "Engineering / Architecture",
  "mann architectural engineering": "Engineering / Architecture",
  "mann architectural engineering, llc": "Engineering / Architecture",
  "brucker engineering": "Engineering / Architecture",
  "brucker engineering company": "Engineering / Architecture",
  "thd design group": "Engineering / Architecture",

  // Permits / Fees
  "mgi risk advisors": "Permits / Fees",
  "accurate disbursing": "Permits / Fees",
  "accurate disbursing - operating account": "Permits / Fees",
  "closing draw": "Permits / Fees",

  // Miscellaneous
  "energy petroleum": "Miscellaneous",
  "amerigas": "Miscellaneous",
  "amerigas-5463": "Miscellaneous",
  "amerigas - 1015": "Miscellaneous",
  "miner's towing": "Miscellaneous",
  "miner's towing co., inc.": "Miscellaneous",

  // General Construction (everything else)
  "banze flatwork": "General Construction",
  "banze flatwork, llc": "General Construction",
  "tomam llc": "General Construction",
  "ljld llc": "General Construction",
  "ljld, llc": "General Construction",
  "inventory sales co": "General Construction",
  "herc rentals": "General Construction",
  "american burglary and fire": "General Construction",
  "american burglary and fire, inc.": "General Construction",
  "appliance discounters": "General Construction",
  "chely's cleaning services": "General Construction",
  "rosch company": "General Construction",
  "rosch company, llc": "General Construction",
  "pass security": "General Construction",
  "paid from equity": "General Construction",
};

export default async function handler(req, res) {
  try {
    const { data: invoices, error } = await supabaseAdmin
      .from("invoices")
      .select("id, vendor");

    if (error) throw error;

    const updates = {};
    const unmapped = new Set();
    let matched = 0;

    for (const inv of invoices) {
      const key = (inv.vendor || "").toLowerCase().trim();
      const trade = VENDOR_TRADES[key];
      if (trade) {
        if (!updates[trade]) updates[trade] = [];
        updates[trade].push(inv.id);
        matched++;
      } else {
        unmapped.add(inv.vendor);
      }
    }

    // Batch update by trade category
    for (const [trade, ids] of Object.entries(updates)) {
      const { error: updErr } = await supabaseAdmin
        .from("invoices")
        .update({ trade_category: trade })
        .in("id", ids);
      if (updErr) throw updErr;
    }

    return res.status(200).json({
      ok: true,
      matched,
      totalInvoices: invoices.length,
      categoriesUpdated: Object.keys(updates).length,
      counts: Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, v.length])),
      unmappedVendors: [...unmapped],
    });
  } catch (err) {
    console.error("Categorize error:", err);
    return res.status(500).json({ error: err.message });
  }
}
