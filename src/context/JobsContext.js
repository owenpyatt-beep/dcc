import React, { createContext, useContext, useReducer, useEffect } from "react";
import { SEED_JOBS } from "../data/jobs";

const STORAGE_KEY = "debrecht_jobs";

const JobsContext = createContext(null);

function nextJobId(jobs) {
  const nums = jobs.map((j) => parseInt(j.id.replace("J-", ""), 10) || 0);
  return `J-${String(Math.max(0, ...nums) + 1).padStart(4, "0")}`;
}

function recomputeJob(job) {
  const drawnToDate = job.draws
    .filter((d) => d.status === "funded")
    .reduce((s, d) => s + d.amount, 0);
  return { ...job, drawnToDate };
}

function jobsReducer(state, action) {
  switch (action.type) {
    case "ADD_JOB": {
      const { name, address, type, loanAmount, startDate, estCompletion } =
        action.payload;
      const id = nextJobId(state);
      const shortName = name.split(/\s+/)[0];
      const newJob = {
        id,
        name,
        shortName,
        address,
        type,
        units: 0,
        loanAmount,
        drawnToDate: 0,
        completion: 0,
        foreman: "",
        pm: "",
        startDate,
        estCompletion,
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
      };
      return [...state, newJob];
    }

    case "ADD_DRAW": {
      const { jobId } = action.payload;
      return state.map((j) => {
        if (j.id !== jobId) return j;
        const maxNum = j.draws.reduce((m, d) => Math.max(m, d.num), 0);
        return {
          ...j,
          draws: [
            ...j.draws,
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
      return state.map((j) => {
        if (j.id !== jobId) return j;
        const draws = j.draws.map((d) => {
          if (d.num !== drawNum) return d;
          const amount = invoices.reduce((s, inv) => s + inv.amountDue, 0);
          return {
            ...d,
            extractedInvoices: invoices,
            amount,
            invoices: invoices.length,
          };
        });
        const allInvoices = draws.flatMap(
          (d) => d.extractedInvoices || []
        );
        const tradeMap = {};
        allInvoices.forEach((inv) => {
          const cat = inv.tradeCategory || "Other";
          tradeMap[cat] = (tradeMap[cat] || 0) + inv.amountDue;
        });
        const tradeBreakdown = Object.entries(tradeMap)
          .map(([trade, amount]) => ({ trade, amount }))
          .sort((a, b) => b.amount - a.amount);
        const updated = {
          ...j,
          draws,
          tradeBreakdown:
            tradeBreakdown.length > 0 ? tradeBreakdown : j.tradeBreakdown,
        };
        return recomputeJob(updated);
      });
    }

    case "UPDATE_DRAW_STATUS": {
      const { jobId, drawNum, status, submitted, funded } = action.payload;
      return state.map((j) => {
        if (j.id !== jobId) return j;
        const draws = j.draws.map((d) => {
          if (d.num !== drawNum) return d;
          return {
            ...d,
            status,
            submitted: submitted !== undefined ? submitted : d.submitted,
            funded: funded !== undefined ? funded : d.funded,
          };
        });
        return recomputeJob({ ...j, draws });
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
  return SEED_JOBS;
}

export function JobsProvider({ children }) {
  const [jobs, dispatch] = useReducer(jobsReducer, null, loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs]);

  const ctx = {
    jobs,
    addJob: (payload) => dispatch({ type: "ADD_JOB", payload }),
    addDraw: (jobId) => dispatch({ type: "ADD_DRAW", payload: { jobId } }),
    commitExtraction: (jobId, drawNum, invoices) =>
      dispatch({
        type: "COMMIT_EXTRACTION",
        payload: { jobId, drawNum, invoices },
      }),
    updateDrawStatus: (jobId, drawNum, status, extra = {}) =>
      dispatch({
        type: "UPDATE_DRAW_STATUS",
        payload: { jobId, drawNum, status, ...extra },
      }),
  };

  return <JobsContext.Provider value={ctx}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within JobsProvider");
  return ctx;
}
