// Industrial Skeuomorphism palette tokens.
// Legacy keys (bg0..bg4, gold, text0..text3) remain for compatibility — values
// remapped to the light/chassis system. Prefer Tailwind classes (bg-chassis,
// text-ink, shadow-card, etc.) in new code.
export const T = {
  // Surfaces (light chassis, recessed, panels)
  bg0: "#e0e5ec", // chassis (was near-black)
  bg1: "#e0e5ec",
  bg2: "#e0e5ec",
  bg3: "#f0f2f5", // raised panel
  bg4: "#d1d9e6", // recessed well

  // Borders + dividers
  border: "rgba(74, 85, 104, 0.12)",
  borderHover: "rgba(74, 85, 104, 0.28)",

  // Accent — formerly "gold", now Braun safety orange
  gold: "#ff4757",
  goldDim: "rgba(255, 71, 87, 0.12)",
  goldBorder: "rgba(255, 71, 87, 0.30)",

  // Status colors (LED tones)
  blue: "#3b82f6",
  blueDim: "rgba(59, 130, 246, 0.12)",
  green: "#22c55e",
  greenDim: "rgba(34, 197, 94, 0.12)",
  amber: "#f59e0b",
  amberDim: "rgba(245, 158, 11, 0.12)",
  red: "#ef4444",
  redDim: "rgba(239, 68, 68, 0.12)",

  // Inks (dark text on light surface)
  text0: "#2d3436",
  text1: "#4a5568",
  text2: "#636e72",
  text3: "#9ca3af",
};

export const SEED_PROPERTIES = [
  {
    id: "P-0001",
    category: "managed",
    name: "West Village Apartments",
    shortName: "West Village",
    address: "986 American Legion Dr, Festus, MO 63028",
    type: "Multi-Family",
    totalUnits: 200,
    occupiedUnits: 181,
    leasedUnits: 195,
    delinquent30: 5,
    delinquent60: 0,
    delinquentAmount30: 2373,
    delinquentAmount60: 0,
    monthlyIncome: 277923,
    collectedIncome: 256431,
    monthRentalIncome: 256431,
    monthTotalIncome: 277923,
    monthExpenses: 280,
    monthNOI: 278203,
    ytdRentalIncome: 507466,
    ytdTotalIncome: 543181,
    ytdExpenses: 560,
    ytdNOI: 543741,
    vacantRented: 14,
    vacantUnrented: 5,
    noticeRented: 6,
    noticeUnrented: 14,
  },
  {
    id: "P-0002",
    category: "build",
    name: "The Legion",
    shortName: "Legion",
    address: "849 American Legion Dr",
    type: "Multi-Family",
    totalProjectCost: 26_000_000,
    loanAmount: 20_800_000,
    equityRequired: 5_200_000,
    equityIn: 0,
    drawnToDate: 0,
    completion: 0,
    foreman: "",
    pm: "Jenny",
    startDate: "",
    estCompletion: "",
    draws: [
      {
        num: 1,
        status: "submitted",
        amount: 0,
        invoices: 0,
        submitted: null,
        funded: null,
        accuracy: null,
        extractedInvoices: null,
      },
    ],
    tradeBreakdown: [],
    cashflow: [],
    hasLeasing: true,
    totalUnits: 0,
    totalBuildings: 0,
    buildingsUnderCO: 0,
    unitsReadyToLease: 0,
    occupiedUnits: 0,
    leasedUnits: 0,
  },
];

export const DRAW_STATUS = {
  submitted: { label: "Submitted", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  funded: { label: "Funded", color: T.green, bg: T.greenDim },
};
