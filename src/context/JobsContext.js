import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";

const JobsContext = createContext(null);

const INITIAL_STATE = {
  properties: [],
  draws: {},       // keyed by property_id
  invoices: {},    // keyed by draw_id
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "LOAD_DATA":
      return {
        ...state,
        properties: action.payload.properties,
        draws: action.payload.draws,
        invoices: action.payload.invoices,
        loading: false,
        error: null,
      };

    case "UPDATE_PROPERTIES":
      return { ...state, properties: action.payload };

    case "UPDATE_DRAWS":
      return { ...state, draws: { ...state.draws, [action.payload.propertyId]: action.payload.draws } };

    case "UPDATE_INVOICES":
      return { ...state, invoices: { ...state.invoices, [action.payload.drawId]: action.payload.invoices } };

    default:
      return state;
  }
}

// ── Helpers to convert DB rows to frontend shape ──────
function dbToProperty(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    shortName: row.short_name,
    address: row.address,
    type: row.type,
    // managed
    totalUnits: row.total_units || 0,
    occupiedUnits: row.occupied_units || 0,
    leasedUnits: row.leased_units || 0,
    delinquent30: row.delinquent_30 || 0,
    delinquent60: row.delinquent_60 || 0,
    delinquentAmount30: parseFloat(row.delinquent_amount_30) || 0,
    delinquentAmount60: parseFloat(row.delinquent_amount_60) || 0,
    monthlyIncome: parseFloat(row.monthly_income) || 0,
    collectedIncome: parseFloat(row.collected_income) || 0,
    vacantRented: row.vacant_rented || 0,
    vacantUnrented: row.vacant_unrented || 0,
    noticeRented: row.notice_rented || 0,
    noticeUnrented: row.notice_unrented || 0,
    monthRentalIncome: parseFloat(row.month_rental_income) || 0,
    monthTotalIncome: parseFloat(row.month_total_income) || 0,
    monthExpenses: parseFloat(row.month_expenses) || 0,
    monthNOI: parseFloat(row.month_noi) || 0,
    ytdRentalIncome: parseFloat(row.ytd_rental_income) || 0,
    ytdTotalIncome: parseFloat(row.ytd_total_income) || 0,
    ytdExpenses: parseFloat(row.ytd_expenses) || 0,
    ytdNOI: parseFloat(row.ytd_noi) || 0,
    lastSynced: row.last_synced,
    // build
    totalProjectCost: parseFloat(row.total_project_cost) || 0,
    loanAmount: parseFloat(row.loan_amount) || 0,
    equityRequired: parseFloat(row.equity_required) || 0,
    equityIn: parseFloat(row.equity_in) || 0,
    drawnToDate: parseFloat(row.drawn_to_date) || 0,
    completion: row.completion || 0,
    foreman: row.foreman || "",
    pm: row.pm || "",
    startDate: row.start_date || "",
    estCompletion: row.est_completion || "",
    hasLeasing: row.has_leasing || false,
    totalBuildings: row.total_buildings || 0,
    buildingsUnderCO: row.buildings_under_co || 0,
    unitsReadyToLease: row.units_ready_to_lease || 0,
  };
}

function dbToDraw(row) {
  return {
    id: row.id,
    propertyId: row.property_id,
    num: row.num,
    status: row.status,
    amount: parseFloat(row.amount) || 0,
    invoices: row.invoice_count || 0,
    submitted: row.submitted_date,
    funded: row.funded_date,
    accuracy: row.accuracy ? parseFloat(row.accuracy) : null,
  };
}

function dbToInvoice(row) {
  return {
    id: row.id,
    drawId: row.draw_id,
    propertyId: row.property_id,
    vendor: row.vendor,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    amountDue: parseFloat(row.amount_due) || 0,
    jobName: row.job_name,
    tradeCategory: row.trade_category,
    invoiceType: row.invoice_type,
    missingDataFlag: row.missing_data_flag,
  };
}

// ── Provider ──────────────────────────────────────────
export function JobsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Load all data on mount
  const loadData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [propRes, drawRes] = await Promise.all([
        supabase.from("properties").select("*").order("created_at"),
        supabase.from("draws").select("*").order("num"),
      ]);

      if (propRes.error) throw propRes.error;
      if (drawRes.error) throw drawRes.error;

      const properties = propRes.data.map(dbToProperty);

      // Group draws by property_id
      const draws = {};
      for (const row of drawRes.data) {
        const pid = row.property_id;
        if (!draws[pid]) draws[pid] = [];
        draws[pid].push(dbToDraw(row));
      }

      // Attach draws to build properties for compatibility
      const propertiesWithDraws = properties.map((p) => {
        if (p.category === "build") {
          return { ...p, draws: draws[p.id] || [] };
        }
        return p;
      });

      dispatch({
        type: "LOAD_DATA",
        payload: { properties: propertiesWithDraws, draws, invoices: {} },
      });
    } catch (err) {
      console.error("Failed to load data:", err);
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Actions ─────────────────────────────────────────
  const addProperty = async (payload) => {
    const isManaged = payload.category === "managed";
    const shortName = payload.shortName || payload.name.split(/\s+/)[0];

    const insert = {
      category: payload.category,
      name: payload.name,
      short_name: shortName,
      address: payload.address,
      type: payload.type || "Multi-Family",
    };

    if (isManaged) {
      insert.total_units = parseInt(payload.totalUnits, 10) || 0;
    } else {
      insert.total_project_cost = parseFloat(payload.totalProjectCost) || 0;
      insert.loan_amount = parseFloat(payload.loanAmount) || 0;
      insert.equity_required = parseFloat(payload.equityRequired) || 0;
      insert.start_date = payload.startDate || "";
      insert.est_completion = payload.estCompletion || "";
    }

    const { data, error } = await supabase
      .from("properties")
      .insert(insert)
      .select()
      .single();

    if (error) { console.error("Add property error:", error); return; }

    // Create first draw for build properties
    if (!isManaged) {
      await supabase.from("draws").insert({
        property_id: data.id,
        num: 1,
        status: "submitted",
        amount: 0,
        invoice_count: 0,
      });
    }

    await loadData();
  };

  const updateProperty = async (id, updates) => {
    // Convert camelCase to snake_case for DB
    const dbUpdates = {};
    const mapping = {
      totalUnits: "total_units", occupiedUnits: "occupied_units", leasedUnits: "leased_units",
      delinquent30: "delinquent_30", delinquent60: "delinquent_60",
      delinquentAmount30: "delinquent_amount_30", delinquentAmount60: "delinquent_amount_60",
      monthlyIncome: "monthly_income", collectedIncome: "collected_income",
      totalProjectCost: "total_project_cost", loanAmount: "loan_amount",
      equityRequired: "equity_required", equityIn: "equity_in",
      completion: "completion", totalBuildings: "total_buildings",
      buildingsUnderCO: "buildings_under_co", unitsReadyToLease: "units_ready_to_lease",
      vacantRented: "vacant_rented", vacantUnrented: "vacant_unrented",
      noticeRented: "notice_rented", noticeUnrented: "notice_unrented",
      monthRentalIncome: "month_rental_income", monthTotalIncome: "month_total_income",
      monthExpenses: "month_expenses", monthNOI: "month_noi",
      ytdRentalIncome: "ytd_rental_income", ytdTotalIncome: "ytd_total_income",
      ytdExpenses: "ytd_expenses", ytdNOI: "ytd_noi",
      startDate: "start_date", estCompletion: "est_completion",
      foreman: "foreman", pm: "pm",
    };

    for (const [key, val] of Object.entries(updates)) {
      const dbKey = mapping[key] || key;
      dbUpdates[dbKey] = val;
    }

    const { error } = await supabase
      .from("properties")
      .update(dbUpdates)
      .eq("id", id);

    if (error) { console.error("Update property error:", error); return; }
    await loadData();
  };

  const addDraw = async (propertyId) => {
    const currentDraws = state.draws[propertyId] || [];
    const maxNum = currentDraws.reduce((m, d) => Math.max(m, d.num), 0);

    const { error } = await supabase.from("draws").insert({
      property_id: propertyId,
      num: maxNum + 1,
      status: "submitted",
      amount: 0,
      invoice_count: 0,
    });

    if (error) {
      console.error("Add draw error:", error);
      throw new Error(error.message);
    }
    await loadData();
  };

  const updateDrawStatus = async (propertyId, drawNum, status, extra = {}) => {
    const draws = state.draws[propertyId] || [];
    const draw = draws.find((d) => d.num === drawNum);
    if (!draw) return;

    const updates = { status };
    if (extra.submitted) updates.submitted_date = extra.submitted;
    if (extra.funded) updates.funded_date = extra.funded;

    const { error } = await supabase
      .from("draws")
      .update(updates)
      .eq("id", draw.id);

    if (error) { console.error("Update draw status error:", error); return; }

    // If funded, recompute drawn_to_date
    if (status === "funded") {
      const allDraws = draws.map((d) =>
        d.id === draw.id ? { ...d, status: "funded", amount: d.amount } : d
      );
      const drawnToDate = allDraws
        .filter((d) => d.status === "funded")
        .reduce((s, d) => s + d.amount, 0);

      await supabase
        .from("properties")
        .update({ drawn_to_date: drawnToDate })
        .eq("id", propertyId);

      // Add cashflow entry
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthKey = monthNames[new Date().getMonth()];

      const { data: existingCf } = await supabase
        .from("cashflow")
        .select("*")
        .eq("property_id", propertyId)
        .eq("month", monthKey)
        .single();

      if (existingCf) {
        await supabase
          .from("cashflow")
          .update({ drawn: existingCf.drawn + draw.amount })
          .eq("id", existingCf.id);
      } else {
        await supabase.from("cashflow").insert({
          property_id: propertyId,
          month: monthKey,
          drawn: draw.amount,
          cumulative: 0,
        });
      }
    }

    await loadData();
  };

  const commitExtraction = async (propertyId, drawNum, extractedInvoices) => {
    const draws = state.draws[propertyId] || [];
    const draw = draws.find((d) => d.num === drawNum);
    if (!draw) return;

    const totalAmount = extractedInvoices.reduce((s, inv) => s + inv.amountDue, 0);

    // Update draw amount and count
    await supabase
      .from("draws")
      .update({
        amount: totalAmount,
        invoice_count: extractedInvoices.length,
      })
      .eq("id", draw.id);

    // Delete old invoices for this draw and insert new ones
    await supabase.from("invoices").delete().eq("draw_id", draw.id);

    const invoiceRows = extractedInvoices.map((inv) => ({
      draw_id: draw.id,
      property_id: propertyId,
      vendor: inv.vendor,
      invoice_number: inv.invoiceNumber,
      invoice_date: inv.invoiceDate,
      amount_due: inv.amountDue,
      job_name: inv.jobName,
      trade_category: inv.tradeCategory,
      invoice_type: inv.invoiceType || "standard",
      missing_data_flag: inv.missingDataFlag,
    }));

    if (invoiceRows.length > 0) {
      await supabase.from("invoices").insert(invoiceRows);
    }

    // Log the extraction
    await supabase.from("extraction_logs").insert({
      draw_id: draw.id,
      property_id: propertyId,
      invoice_count: extractedInvoices.length,
      total_amount: totalAmount,
      model: "claude-sonnet-4-20250514",
    });

    await loadData();
  };

  const syncAppfolio = async (appfolioProperties) => {
    for (const ap of appfolioProperties) {
      // Find matching managed property by name
      const match = state.properties.find(
        (p) =>
          p.category === "managed" &&
          p.name.toLowerCase().trim() === ap.name.toLowerCase().trim()
      );

      if (match) {
        await supabase
          .from("properties")
          .update({
            total_units: ap.totalUnits,
            occupied_units: ap.occupiedUnits,
            leased_units: ap.leasedUnits,
            monthly_income: ap.monthlyIncome,
            collected_income: ap.collectedIncome || 0,
            delinquent_30: ap.delinquent30,
            delinquent_60: ap.delinquent60,
            delinquent_amount_30: ap.delinquentAmount30,
            delinquent_amount_60: ap.delinquentAmount60,
            address: ap.address || match.address,
            last_synced: new Date().toISOString(),
          })
          .eq("id", match.id);
      } else {
        await supabase.from("properties").insert({
          category: "managed",
          name: ap.name,
          short_name: ap.name.split(/\s+/)[0],
          address: ap.address || "",
          type: ap.propertyType || "Multi-Family",
          total_units: ap.totalUnits,
          occupied_units: ap.occupiedUnits,
          leased_units: ap.leasedUnits,
          delinquent_30: ap.delinquent30,
          delinquent_60: ap.delinquent60,
          delinquent_amount_30: ap.delinquentAmount30,
          delinquent_amount_60: ap.delinquentAmount60,
          monthly_income: ap.monthlyIncome,
          collected_income: ap.collectedIncome || 0,
          last_synced: new Date().toISOString(),
        });
      }
    }

    await loadData();
  };

  // Fetch invoices for a specific draw (on demand)
  const loadDrawInvoices = async (drawId) => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("draw_id", drawId)
      .order("created_at");

    if (error) { console.error("Load invoices error:", error); return []; }
    const invoices = data.map(dbToInvoice);
    dispatch({ type: "UPDATE_INVOICES", payload: { drawId, invoices } });
    return invoices;
  };

  // ── Derived data ────────────────────────────────────
  const builds = state.properties.filter((p) => p.category === "build");
  const managed = state.properties.filter((p) => p.category === "managed");

  const ctx = {
    properties: state.properties,
    builds,
    managed,
    draws: state.draws,
    invoicesByDraw: state.invoices,
    loading: state.loading,
    error: state.error,
    addProperty,
    updateProperty,
    addDraw,
    updateDrawStatus,
    commitExtraction,
    syncAppfolio,
    loadDrawInvoices,
    reload: loadData,
  };

  return <JobsContext.Provider value={ctx}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within JobsProvider");
  return ctx;
}
