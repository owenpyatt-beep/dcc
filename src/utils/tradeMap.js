// Trade categories matching the title company portal values
// These are the exact strings used in draw submissions

export const TRADE_CATEGORIES = [
  "General Construction",
  "HVAC",
  "Electrical",
  "Plumbing",
  "Sitework / Grading",
  "Framing",
  "Drywall",
  "Flooring",
  "Cabinets / Millwork",
  "Roofing",
  "Windows / Doors",
  "Landscaping",
  "Permits / Fees",
  "Engineering / Architecture",
  "Miscellaneous",
];

// Normalize AI-extracted trade categories to title company portal values
const TRADE_MAP = {
  "general construction": "General Construction",
  "general": "General Construction",
  "hvac": "HVAC",
  "hvac/mechanical": "HVAC",
  "mechanical": "HVAC",
  "heating": "HVAC",
  "cooling": "HVAC",
  "air conditioning": "HVAC",
  "electrical": "Electrical",
  "electrical work": "Electrical",
  "plumbing": "Plumbing",
  "plumbing work": "Plumbing",
  "fire protection": "Plumbing",
  "fire sprinkler": "Plumbing",
  "sprinkler": "Plumbing",
  "sitework / grading": "Sitework / Grading",
  "sitework/grading": "Sitework / Grading",
  "sitework": "Sitework / Grading",
  "site work": "Sitework / Grading",
  "grading": "Sitework / Grading",
  "excavation": "Sitework / Grading",
  "demolition": "Sitework / Grading",
  "concrete": "Sitework / Grading",
  "framing": "Framing",
  "rough framing": "Framing",
  "lumber": "Framing",
  "structural framing": "Framing",
  "drywall": "Drywall",
  "drywall / plastering": "Drywall",
  "plastering": "Drywall",
  "flooring": "Flooring",
  "tile": "Flooring",
  "cabinets / millwork": "Cabinets / Millwork",
  "cabinets/millwork": "Cabinets / Millwork",
  "cabinets": "Cabinets / Millwork",
  "cabinetry": "Cabinets / Millwork",
  "millwork": "Cabinets / Millwork",
  "carpentry": "Cabinets / Millwork",
  "finish carpentry": "Cabinets / Millwork",
  "welding": "Cabinets / Millwork",
  "roofing": "Roofing",
  "roof": "Roofing",
  "windows / doors": "Windows / Doors",
  "windows/doors": "Windows / Doors",
  "windows": "Windows / Doors",
  "doors": "Windows / Doors",
  "landscaping": "Landscaping",
  "permits / fees": "Permits / Fees",
  "permits/fees": "Permits / Fees",
  "permits": "Permits / Fees",
  "insurance": "Permits / Fees",
  "engineering / architecture": "Engineering / Architecture",
  "engineering/architecture": "Engineering / Architecture",
  "engineering": "Engineering / Architecture",
  "architecture": "Engineering / Architecture",
  "survey": "Engineering / Architecture",
  "miscellaneous": "Miscellaneous",
  "other": "Miscellaneous",
  "fuel": "Miscellaneous",
};

export function mapTrade(category) {
  if (!category) return "General Construction";
  const key = category.toLowerCase().trim();
  return TRADE_MAP[key] || category;
}

export function getTradeCategories() {
  return TRADE_CATEGORIES;
}
