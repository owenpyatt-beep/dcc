import React, { useState, useEffect } from "react";
import { T, DRAW_STATUS } from "../data/jobs";
import { fc, pct, short, Mono, Badge, StatusDot, ProgressBar, KpiCard, COLORS } from "../utils/format";
import { useJobs } from "../context/JobsContext";
import { supabase } from "../utils/supabase";

const STAGE_ORDER = ["compiling", "in_review", "submitted", "funded"];
const NEXT_STAGE = {
  compiling: "in_review",
  in_review: "submitted",
  submitted: "funded",
};
const NEXT_LABEL = {
  compiling: "Move to Review",
  in_review: "Mark Submitted",
  submitted: "Mark Funded",
};

const editInput = {
  background: T.bg4,
  border: `1px solid ${T.border}`,
  borderRadius: 4,
  color: T.text0,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  padding: "6px 10px",
  outline: "none",
  width: 90,
  textAlign: "right",
};

export default function DrawsView() {
  const { builds, addDraw, updateDrawStatus, updateProperty } = useJobs();
  const [selectedJob, setSelectedJob] = useState(builds[0]?.id);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [drawInvoices, setDrawInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [viewMode, setViewMode] = useState("vendor"); // "vendor" or "category"
  const job = builds.find((j) => j.id === selectedJob) || builds[0];
  const stageLabels = {
    compiling: "Compiling",
    in_review: "In Review",
    submitted: "Submitted",
    funded: "Funded",
  };

  // Load invoices when a draw is selected
  useEffect(() => {
    if (!selectedDraw) { setDrawInvoices([]); return; }
    setLoadingInvoices(true);
    supabase
      .from("invoices")
      .select("*")
      .eq("draw_id", selectedDraw.id)
      .order("amount_due", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setDrawInvoices(data);
        setLoadingInvoices(false);
      });
  }, [selectedDraw]);

  // Also load all invoices for this property (for cumulative view)
  const [allInvoices, setAllInvoices] = useState([]);
  useEffect(() => {
    if (!job) return;
    supabase
      .from("invoices")
      .select("*")
      .eq("property_id", job.id)
      .order("amount_due", { ascending: false })
      .then(({ data }) => { if (data) setAllInvoices(data); });
  }, [job?.id]);

  if (!job) return null;

  const handleAdvance = (drawNum, currentStatus) => {
    const next = NEXT_STAGE[currentStatus];
    if (!next) return;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const extra = {};
    if (next === "submitted" || next === "in_review") extra.submitted = today;
    if (next === "funded") extra.funded = today;
    updateDrawStatus(job.id, drawNum, next, extra);
  };

  const handleDrawClick = (draw) => {
    setSelectedDraw(selectedDraw?.id === draw.id ? null : draw);
  };

  const drawnPct = job.loanAmount > 0 ? pct(job.drawnToDate, job.loanAmount) : 0;
  const equityPct = job.equityRequired > 0 ? pct(job.equityIn, job.equityRequired) : 0;

  // Compute vendor breakdown from invoices
  const invoicesToShow = selectedDraw ? drawInvoices : allInvoices;
  const vendorBreakdown = {};
  const categoryBreakdown = {};
  for (const inv of invoicesToShow) {
    const vendor = inv.vendor || "Unknown";
    const cat = inv.trade_category || "General Construction";
    const amt = parseFloat(inv.amount_due) || 0;
    if (!vendorBreakdown[vendor]) vendorBreakdown[vendor] = { vendor, total: 0, count: 0 };
    vendorBreakdown[vendor].total += amt;
    vendorBreakdown[vendor].count++;
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { category: cat, total: 0, count: 0 };
    categoryBreakdown[cat].total += amt;
    categoryBreakdown[cat].count++;
  }
  const vendorList = Object.values(vendorBreakdown).sort((a, b) => b.total - a.total);
  const categoryList = Object.values(categoryBreakdown).sort((a, b) => b.total - a.total);
  const breakdownTotal = invoicesToShow.reduce((s, inv) => s + (parseFloat(inv.amount_due) || 0), 0);

  return (
    <div>
      {/* Job selector */}
      <div
        style={{
          display: "flex", gap: 4, marginBottom: 24, background: T.bg2,
          borderRadius: 10, padding: 4, border: `1px solid ${T.border}`,
          width: "fit-content", alignItems: "center", overflowX: "auto", flexWrap: "nowrap",
        }}
      >
        {builds.map((j) => (
          <button key={j.id} onClick={() => { setSelectedJob(j.id); setSelectedDraw(null); }}
            style={{
              background: selectedJob === j.id ? T.bg4 : "transparent",
              border: selectedJob === j.id ? `1px solid ${T.border}` : "1px solid transparent",
              color: selectedJob === j.id ? T.text0 : T.text2,
              fontSize: 12, fontWeight: 600, padding: "7px 18px", borderRadius: 7,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {j.shortName}
          </button>
        ))}
        <button onClick={() => addDraw(job.id)}
          style={{
            background: T.goldDim, border: `1px solid ${T.goldBorder}`, borderRadius: 7,
            color: T.gold, fontSize: 11, fontWeight: 600, padding: "6px 14px",
            cursor: "pointer", marginLeft: 8, fontFamily: "inherit",
          }}
        >
          + New Draw
        </button>
      </div>

      {/* ── Build Financials ─────────────────────────── */}
      <div className="grid-5" style={{ marginBottom: 24 }}>
        <KpiCard label="Total Project Cost" value={job.totalProjectCost > 0 ? short(job.totalProjectCost) : "\u2014"} sub={job.loanAmount > 0 ? `Loan: ${short(job.loanAmount)}` : ""} accent={T.gold} />
        <KpiCard label="Drawn to Date" value={short(job.drawnToDate)} sub={job.loanAmount > 0 ? `${drawnPct}% of loan` : ""} accent={T.blue} />
        <KpiCard label="Available" value={short(Math.max(0, job.loanAmount - job.drawnToDate))} sub="remaining on loan" accent={T.green} />
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.amber}44, transparent)` }} />
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.text2, marginBottom: 8 }}>Equity In</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: T.text2, fontSize: 16 }}>$</span>
            <input type="number" value={job.equityIn} onChange={(e) => updateProperty(job.id, { equityIn: e.target.value })} style={{ ...editInput, fontSize: 18, fontWeight: 700, width: "100%", color: T.amber }} />
          </div>
          {job.equityRequired > 0 && <div style={{ fontSize: 11, color: T.text2, marginTop: 8 }}>{equityPct}% of {fc(job.equityRequired)} required</div>}
        </div>
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.blue}44, transparent)` }} />
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.text2, marginBottom: 8 }}>Completion</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" value={job.completion} onChange={(e) => updateProperty(job.id, { completion: e.target.value })} style={{ ...editInput, fontSize: 22, fontWeight: 700, width: 70, color: T.blue }} min="0" max="100" />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: T.blue, fontWeight: 700 }}>%</span>
          </div>
          <div style={{ marginTop: 8 }}><ProgressBar value={job.completion} max={100} color={T.blue} height={4} /></div>
        </div>
      </div>

      {/* ── Vendor & Category Breakdown ──────────────── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Breakdown panel */}
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: T.text2 }}>
                {selectedDraw ? `Draw #${selectedDraw.num}` : "All Draws"} — by {viewMode === "vendor" ? "Vendor" : "Category"}
              </div>
              {selectedDraw && (
                <button onClick={() => setSelectedDraw(null)}
                  style={{ background: T.bg4, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text2, fontSize: 10, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit" }}>
                  Show All
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, background: T.bg3, borderRadius: 6, padding: 2 }}>
              <button onClick={() => setViewMode("vendor")}
                style={{ background: viewMode === "vendor" ? T.bg4 : "transparent", border: viewMode === "vendor" ? `1px solid ${T.border}` : "1px solid transparent", color: viewMode === "vendor" ? T.text0 : T.text3, fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
                Vendor
              </button>
              <button onClick={() => setViewMode("category")}
                style={{ background: viewMode === "category" ? T.bg4 : "transparent", border: viewMode === "category" ? `1px solid ${T.border}` : "1px solid transparent", color: viewMode === "category" ? T.text0 : T.text3, fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>
                Category
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {loadingInvoices && selectedDraw ? (
              <div style={{ padding: 24, textAlign: "center", color: T.text3, fontSize: 12 }}>Loading...</div>
            ) : (viewMode === "vendor" ? vendorList : categoryList).length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: T.text3, fontSize: 12 }}>No invoice data</div>
            ) : (
              (viewMode === "vendor" ? vendorList : categoryList).map((item, i) => {
                const name = viewMode === "vendor" ? item.vendor : item.category;
                const p = breakdownTotal > 0 ? pct(item.total, breakdownTotal) : 0;
                return (
                  <div key={name}
                    style={{ padding: "12px 24px", borderBottom: `1px solid ${T.bg3}`, display: "flex", alignItems: "center", gap: 12 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.bg3)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: T.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                      <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>{item.count} payment{item.count !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <Mono style={{ fontSize: 13, fontWeight: 700, color: T.text0 }}>{fc(item.total)}</Mono>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, justifyContent: "flex-end" }}>
                        <div style={{ width: 50, height: 3, borderRadius: 2, background: T.bg4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${p}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                        <Mono style={{ fontSize: 10, color: T.text3 }}>{p}%</Mono>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {breakdownTotal > 0 && (
            <div style={{ padding: "12px 24px", borderTop: `1px solid ${T.border}`, background: T.bg3, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: T.text2 }}>
                {viewMode === "vendor" ? `${vendorList.length} vendors` : `${categoryList.length} categories`} &middot; {invoicesToShow.length} transactions
              </span>
              <Mono style={{ fontSize: 12, color: T.gold }}>{fc(breakdownTotal)}</Mono>
            </div>
          )}
        </div>

        {/* Top vendors quick view */}
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: T.text2, marginBottom: 18 }}>
            Top Vendors — {job.shortName}
          </div>
          {vendorList.slice(0, 8).map((v, i) => (
            <div key={v.vendor} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 7 ? `1px solid ${T.bg3}` : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.vendor}</div>
              </div>
              <Mono style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginLeft: 12 }}>{fc(v.total)}</Mono>
            </div>
          ))}
          {vendorList.length === 0 && (
            <div style={{ color: T.text3, fontSize: 12, textAlign: "center", padding: 20 }}>No vendor data yet</div>
          )}
        </div>
      </div>

      {/* ── Draw History Table ────────────────────────── */}
      <div className="table-wrap">
      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: T.text2 }}>
            Draw History — {job.name}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.text2 }}>
            {fc((job.draws || []).reduce((s, d) => s + d.amount, 0))} total &middot; {(job.draws || []).length} draws
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Draw", "Amount", "Invoices", "Accuracy", "Submitted", "Funded", "Status", ""].map((h) => (
                <th key={h} style={{ padding: "10px 24px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.text3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(job.draws || []).map((d, i) => {
              const isSelected = selectedDraw?.id === d.id;
              return (
                <tr
                  key={d.num}
                  onClick={() => handleDrawClick(d)}
                  style={{
                    borderBottom: i < (job.draws || []).length - 1 ? `1px solid ${T.bg3}` : "none",
                    background: isSelected ? T.bg3 : "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = T.bg3; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "13px 24px", fontSize: 13, fontWeight: 700, color: isSelected ? T.gold : T.text0 }}>
                    #{d.num}
                    {isSelected && <span style={{ marginLeft: 6, fontSize: 9, color: T.gold }}>SELECTED</span>}
                  </td>
                  <td style={{ padding: "13px 24px" }}><Mono style={{ fontSize: 13, color: T.gold }}>{fc(d.amount)}</Mono></td>
                  <td style={{ padding: "13px 24px", fontSize: 12, color: T.text1 }}>{d.invoices}</td>
                  <td style={{ padding: "13px 24px" }}>
                    {d.accuracy ? (
                      <Mono style={{ fontSize: 12, color: d.accuracy > 99.5 ? T.green : T.amber }}>{d.accuracy}%</Mono>
                    ) : (
                      <span style={{ color: T.text3 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "13px 24px", fontSize: 12, color: T.text1 }}>{d.submitted || <span style={{ color: T.text3 }}>—</span>}</td>
                  <td style={{ padding: "13px 24px", fontSize: 12, color: d.funded ? T.green : T.text3 }}>{d.funded || "—"}</td>
                  <td style={{ padding: "13px 24px" }}><StatusDot status={d.status} /></td>
                  <td style={{ padding: "13px 24px", textAlign: "right" }}>
                    {NEXT_STAGE[d.status] && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdvance(d.num, d.status); }}
                        style={{
                          background: `${DRAW_STATUS[NEXT_STAGE[d.status]].color}18`,
                          border: `1px solid ${DRAW_STATUS[NEXT_STAGE[d.status]].color}33`,
                          borderRadius: 5, color: DRAW_STATUS[NEXT_STAGE[d.status]].color,
                          fontSize: 10, fontWeight: 600, padding: "4px 10px",
                          cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                        }}
                      >
                        {NEXT_LABEL[d.status]}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: "12px 24px", borderTop: `1px solid ${T.border}`, background: T.bg3, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: T.text2 }}>Cumulative drawn</span>
          <Mono style={{ fontSize: 12, color: T.gold }}>{fc(job.drawnToDate)} of {fc(job.loanAmount)}</Mono>
        </div>
      </div>
      </div>
    </div>
  );
}
