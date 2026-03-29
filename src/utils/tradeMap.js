const TRADE_MAP = {
  "concrete": "Concrete / Foundation",
  "concrete / foundation": "Concrete / Foundation",
  "concrete/foundation": "Concrete / Foundation",
  "foundation": "Concrete / Foundation",
  "footings": "Concrete / Foundation",
  "framing": "Framing",
  "rough framing": "Framing",
  "structural framing": "Framing",
  "electrical": "Electrical",
  "electrical work": "Electrical",
  "plumbing": "Plumbing",
  "plumbing work": "Plumbing",
  "hvac": "HVAC",
  "hvac/mechanical": "HVAC",
  "mechanical": "HVAC",
  "heating": "HVAC",
  "drywall": "Drywall",
  "drywall / plastering": "Drywall",
  "plastering": "Drywall",
  "roofing": "Roofing",
  "roof": "Roofing",
  "finish carpentry": "Finish Carpentry",
  "carpentry": "Finish Carpentry",
  "trim carpentry": "Finish Carpentry",
  "trim": "Finish Carpentry",
  "cabinetry": "Finish Carpentry",
  "painting": "Painting",
  "paint": "Painting",
  "site work": "Site Work",
  "sitework": "Site Work",
  "excavation": "Site Work",
  "demolition": "Site Work",
  "grading": "Site Work",
  "insulation": "Insulation",
  "flooring": "Flooring",
  "tile": "Flooring",
  "windows": "Windows & Doors",
  "windows & doors": "Windows & Doors",
  "doors": "Windows & Doors",
  "landscaping": "Landscaping",
  "general conditions": "General Conditions",
  "general": "General Conditions",
  "other": "Other",
};

export function mapTrade(category) {
  if (!category) return "Other";
  const key = category.toLowerCase().trim();
  return TRADE_MAP[key] || category;
}

export function getTradeCategories() {
  return [...new Set(Object.values(TRADE_MAP))].sort();
}
