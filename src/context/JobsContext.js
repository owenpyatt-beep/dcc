import React, { createContext, useContext, useReducer, useEffect } from "react";
import { SEED_PROPERTIES } from "../data/jobs";

const STORAGE_KEY = "debrecht_properties_v3";

const JobsContext = createContext(null);

function nextPropertyId(properties) {
  const nums = properties.map((p) => parseInt(p.id.replace("P-", ""), 10) || 0);
  return `P-${String(Math.max(0, ...nums) + 1).padStart(4, "0")}`;
}

function recomputeBuild(prop) {
  if (prop.category !== "build") return prop;
  const drawnToDate = prop.draws
    .filter((d) => d.status === "funded")
    .reduce((s, d) => s + d.amount, 0);
  return { ...prop, drawnToDate };
}

function propertiesReducer(state, action) {
  switch (action.type) {
    case "ADD_PROPERTY": {
      const p = action.payload;
      const id = nextPropertyId(state);
      const shortName = p.shortName || p.name.split(/\s+/)[0];

      if (p.category === "managed") {
        return [
          ...state,
          {
            id,
            category: "managed",
            name: p.name,
            shortName,
            address: p.address,
            type: p.type || "Multi-Family",
            totalUnits: parseInt(p.totalUnits, 10) || 0,
            occupiedUnits: 0,
            leasedUnits: 0,
            delinquent30: 0,
            delinquent60: 0,
            delinquentAmount30: 0,
            delinquentAmount60: 0,
            monthlyIncome: 0,
            collectedIncome: 0,
          },
        ];
      }

      // Build property
      return [
        ...state,
        {
          id,
          category: "build",
          name: p.name,
          shortName,
          address: p.address,
          type: p.type || "Multi-Family",
          totalProjectCost: parseFloat(p.totalProjectCost) || 0,
          loanAmount: parseFloat(p.loanAmount) || 0,
          equityRequired: parseFloat(p.equityRequired) || 0,
          equityIn: 0,
          drawnToDate: 0,
          completion: 0,
          foreman: "",
          pm: "",
          startDate: p.startDate || "",
          estCompletion: p.estCompletion || "",
          draws: [
            {
              num: 1,
              status: "compiling",
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
          hasLeasing: false,
          totalUnits: 0,
          totalBuildings: 0,
          buildingsUnderCO: 0,
          unitsReadyToLease: 0,
          occupiedUnits: 0,
          leasedUnits: 0,
        },
      ];
    }

    case "UPDATE_PROPERTY": {
      const { id, updates } = action.payload;
      return state.map((p) => {
        if (p.id !== id) return p;
        const numFields = [
          "totalUnits", "occupiedUnits", "leasedUnits",
          "delinquent30", "delinquent60",
          "delinquentAmount30", "delinquentAmount60",
          "monthlyIncome", "collectedIncome",
          "totalProjectCost", "loanAmount", "equityRequired", "equityIn",
          "completion", "totalBuildings", "buildingsUnderCO",
          "unitsReadyToLease",
        ];
        const cleaned = { ...updates };
        numFields.forEach((f) => {
          if (f in cleaned) cleaned[f] = parseFloat(cleaned[f]) || 0;
        });
        return { ...p, ...cleaned };
      });
    }

    case "ADD_DRAW": {
      const { jobId } = action.payload;
      return state.map((p) => {
        if (p.id !== jobId || p.category !== "build") return p;
        const maxNum = p.draws.reduce((m, d) => Math.max(m, d.num), 0);
        return {
          ...p,
          draws: [
            ...p.draws,
            {
              num: maxNum + 1,
              status: "compiling",
              amount: 0,
              invoices: 0,
              submitted: null,
              funded: null,
              accuracy: null,
              extractedInvoices: null,
            },
          ],
        };
      });
    }

    case "COMMIT_EXTRACTION": {
      const { jobId, drawNum, invoices } = action.payload;
      return state.map((p) => {
        if (p.id !== jobId) return p;
        const draws = p.draws.map((d) => {
          if (d.num !== drawNum) return d;
          const amount = invoices.reduce((s, inv) => s + inv.amountDue, 0);
          return {
            ...d,
            extractedInvoices: invoices,
            amount,
            invoices: invoices.length,
          };
        });
        const allInvoices = draws.flatMap((d) => d.extractedInvoices || []);
        const tradeMap = {};
        allInvoices.forEach((inv) => {
          const cat = inv.tradeCategory || "Other";
          tradeMap[cat] = (tradeMap[cat] || 0) + inv.amountDue;
        });
        const tradeBreakdown = Object.entries(tradeMap)
          .map(([trade, amount]) => ({ trade, amount }))
          .sort((a, b) => b.amount - a.amount);
        const updated = {
          ...p,
          draws,
          tradeBreakdown: tradeBreakdown.length > 0 ? tradeBreakdown : p.tradeBreakdown,
        };
        return recomputeBuild(updated);
      });
    }

    case "SYNC_APPFOLIO": {
      const { appfolioProperties } = action.payload;
      let updated = [...state];

      for (const ap of appfolioProperties) {
        // Match by name (case-insensitive, trimmed)
        const match = updated.find(
          (p) =>
            p.category === "managed" &&
            p.name.toLowerCase().trim() === ap.name.toLowerCase().trim()
        );

        if (match) {
          // Update existing managed property with Appfolio data
          updated = updated.map((p) =>
            p.id === match.id
              ? {
                  ...p,
                  totalUnits: ap.totalUnits,
                  occupiedUnits: ap.occupiedUnits,
                  leasedUnits: ap.leasedUnits,
                  monthlyIncome: ap.monthlyIncome,
                  collectedIncome: ap.collectedIncome || p.collectedIncome,
                  delinquent30: ap.delinquent30,
                  delinquent60: ap.delinquent60,
                  delinquentAmount30: ap.delinquentAmount30,
                  delinquentAmount60: ap.delinquentAmount60,
                  address: ap.address || p.address,
                  lastSynced: new Date().toISOString(),
                }
              : p
          );
        } else {
          // Create new managed property from Appfolio
          const id = nextPropertyId(updated);
          updated.push({
            id,
            category: "managed",
            name: ap.name,
            shortName: ap.name.split(/\s+/)[0],
            address: ap.address || "",
            type: ap.propertyType || "Multi-Family",
            totalUnits: ap.totalUnits,
            occupiedUnits: ap.occupiedUnits,
            leasedUnits: ap.leasedUnits,
            delinquent30: ap.delinquent30,
            delinquent60: ap.delinquent60,
            delinquentAmount30: ap.delinquentAmount30,
            delinquentAmount60: ap.delinquentAmount60,
            monthlyIncome: ap.monthlyIncome,
            collectedIncome: ap.collectedIncome || 0,
            lastSynced: new Date().toISOString(),
          });
        }
      }

      return updated;
    }

    case "UPDATE_DRAW_STATUS": {
      const { jobId, drawNum, status, submitted, funded } = action.payload;
      return state.map((p) => {
        if (p.id !== jobId) return p;
        const draws = p.draws.map((d) => {
          if (d.num !== drawNum) return d;
          return {
            ...d,
            status,
            submitted: submitted !== undefined ? submitted : d.submitted,
            funded: funded !== undefined ? funded : d.funded,
          };
        });
        let updated = recomputeBuild({ ...p, draws });

        // Auto-compute cashflow when a draw is funded
        if (status === "funded") {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const fundedDraw = draws.find((d) => d.num === drawNum);
          const drawAmount = fundedDraw ? fundedDraw.amount : 0;
          const fundedDate = funded || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const monthKey = monthNames[new Date(fundedDate).getMonth()] || monthNames[new Date().getMonth()];

          let cashflow = [...(updated.cashflow || [])];
          const existing = cashflow.find((c) => c.month === monthKey);
          if (existing) {
            cashflow = cashflow.map((c) =>
              c.month === monthKey ? { ...c, drawn: c.drawn + drawAmount } : c
            );
          } else {
            cashflow.push({ month: monthKey, drawn: drawAmount, cumulative: 0 });
          }
          // Recalculate cumulative
          let cum = 0;
          cashflow = cashflow.map((c) => {
            cum += c.drawn;
            return { ...c, cumulative: cum };
          });
          updated = { ...updated, cashflow };
        }

        return updated;
      });
    }

    default:
      return state;
  }
}

function loadInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return SEED_PROPERTIES;
}

export function JobsProvider({ children }) {
  const [properties, dispatch] = useReducer(propertiesReducer, null, loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  }, [properties]);

  const builds = properties.filter((p) => p.category === "build");
  const managed = properties.filter((p) => p.category === "managed");

  const ctx = {
    properties,
    builds,
    managed,
    addProperty: (payload) => dispatch({ type: "ADD_PROPERTY", payload }),
    updateProperty: (id, updates) =>
      dispatch({ type: "UPDATE_PROPERTY", payload: { id, updates } }),
    addDraw: (jobId) => dispatch({ type: "ADD_DRAW", payload: { jobId } }),
    commitExtraction: (jobId, drawNum, invoices) =>
      dispatch({ type: "COMMIT_EXTRACTION", payload: { jobId, drawNum, invoices } }),
    updateDrawStatus: (jobId, drawNum, status, extra = {}) =>
      dispatch({ type: "UPDATE_DRAW_STATUS", payload: { jobId, drawNum, status, ...extra } }),
    syncAppfolio: (appfolioProperties) =>
      dispatch({ type: "SYNC_APPFOLIO", payload: { appfolioProperties } }),
  };

  return <JobsContext.Provider value={ctx}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within JobsProvider");
  return ctx;
}
