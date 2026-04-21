import React, { useState, useEffect } from "react";
import {
  Plus,
  ArrowRight,
  LayoutList,
  Tag,
  Loader2,
  X as XIcon,
} from "lucide-react";
import { DRAW_STATUS } from "../data/jobs";
import {
  fc,
  pct,
  short,
  Mono,
  StatusDot,
  ProgressBar,
  KpiCard,
  COLORS,
} from "../utils/format";
import { useJobs } from "../context/JobsContext";
import { supabase } from "../utils/supabase";
import { Button } from "./ui/Button";
import { Stamp } from "./ui/Typography";
import { LED } from "./ui/LED";

const NEXT_STAGE = {
  compiling: "in_review",
  in_review: "submitted",
  submitted: "funded",
};
const NEXT_LABEL = {
  compiling: "Submit for Review",
  in_review: "Mark Submitted",
  submitted: "Mark as Funded",
};

function PillTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        "press px-5 py-2.5 rounded-lg text-[12px] font-mono uppercase tracking-[0.08em] font-bold transition-all " +
        (active
          ? "bg-chassis text-ink shadow-pressed"
          : "text-label hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

function SegmentToggle({ value, onChange, options }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-chassis shadow-recessed-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.08em] font-bold transition-all " +
            (value === o.value
              ? "bg-chassis text-ink shadow-card"
              : "text-label hover:text-ink")
          }
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function DrawsView({ selectedId }) {
  const { builds, addDraw, updateDrawStatus, updateProperty } = useJobs();
  const [selectedJob, setSelectedJob] = useState(selectedId || builds[0]?.id);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [creatingDraw, setCreatingDraw] = useState(false);
  const [newDrawMessage, setNewDrawMessage] = useState(null);
  const [drawInvoices, setDrawInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [viewMode, setViewMode] = useState("vendor");
  const [allInvoices, setAllInvoices] = useState([]);

  const job = builds.find((j) => j.id === selectedJob) || builds[0];

  const handleNewDraw = async () => {
    if (creatingDraw || !job) return;
    setCreatingDraw(true);
    setNewDrawMessage(null);
    try {
      await addDraw(job.id);
      setNewDrawMessage(`New draft draw created for ${job.shortName}`);
      setTimeout(() => setNewDrawMessage(null), 3500);
    } catch (err) {
      setNewDrawMessage(`Error: ${err.message}`);
    } finally {
      setCreatingDraw(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      setSelectedJob(selectedId);
      setSelectedDraw(null);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedDraw) {
      setDrawInvoices([]);
      return;
    }
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

  useEffect(() => {
    if (!job) return;
    supabase
      .from("invoices")
      .select("*")
      .eq("property_id", job.id)
      .order("amount_due", { ascending: false })
      .then(({ data }) => {
        if (data) setAllInvoices(data);
      });
  }, [job?.id]);

  if (!job) return null;

  const handleAdvance = (drawNum, currentStatus) => {
    const next = NEXT_STAGE[currentStatus];
    if (!next) return;
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const extra = {};
    if (next === "submitted" || next === "in_review") extra.submitted = today;
    if (next === "funded") extra.funded = today;
    updateDrawStatus(job.id, drawNum, next, extra);
  };

  const handleDrawClick = (draw) => {
    setSelectedDraw(selectedDraw?.id === draw.id ? null : draw);
  };

  const invoicesToShow = selectedDraw ? drawInvoices : allInvoices;
  const vendorBreakdown = {};
  const categoryBreakdown = {};
  for (const inv of invoicesToShow) {
    const vendor = inv.vendor || "Unknown";
    const cat = inv.trade_category || "General Construction";
    const amt = parseFloat(inv.amount_due) || 0;
    if (!vendorBreakdown[vendor])
      vendorBreakdown[vendor] = { vendor, total: 0, count: 0 };
    vendorBreakdown[vendor].total += amt;
    vendorBreakdown[vendor].count++;
    if (!categoryBreakdown[cat])
      categoryBreakdown[cat] = { category: cat, total: 0, count: 0 };
    categoryBreakdown[cat].total += amt;
    categoryBreakdown[cat].count++;
  }
  const vendorList = Object.values(vendorBreakdown).sort(
    (a, b) => b.total - a.total
  );
  const categoryList = Object.values(categoryBreakdown).sort(
    (a, b) => b.total - a.total
  );
  const breakdownTotal = invoicesToShow.reduce(
    (s, inv) => s + (parseFloat(inv.amount_due) || 0),
    0
  );

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-chassis shadow-recessed overflow-x-auto">
          {builds.map((j) => (
            <PillTab
              key={j.id}
              active={selectedJob === j.id}
              onClick={() => {
                setSelectedJob(j.id);
                setSelectedDraw(null);
              }}
            >
              {j.shortName}
            </PillTab>
          ))}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleNewDraw}
          disabled={creatingDraw}
          iconLeft={<Plus className="h-3 w-3" strokeWidth={2.5} />}
        >
          {creatingDraw ? "Creating..." : "New Draw"}
        </Button>
      </div>

      {newDrawMessage && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-chassis shadow-recessed-sm">
          <LED
            color={newDrawMessage.startsWith("Error") ? "red" : "green"}
            size={8}
            pulse
          />
          <span
            className={
              "font-mono text-xs " +
              (newDrawMessage.startsWith("Error")
                ? "text-[#b91c1c]"
                : "text-[#15803d]")
            }
          >
            {newDrawMessage}
          </span>
        </div>
      )}

      {/* Build financials — 5 gauges */}
      <div className="grid-5 mb-6">
        <KpiCard
          label="Total Project Cost"
          value={
            job.totalProjectCost > 0 ? short(job.totalProjectCost) : "—"
          }
          sub={job.loanAmount > 0 ? `Loan: ${short(job.loanAmount)}` : ""}
          accent="#ff4757"
        />
        <KpiCard
          label="Drawn to Date"
          value={short(job.drawnToDate)}
          sub={
            job.totalProjectCost > 0
              ? `${pct(job.drawnToDate, job.totalProjectCost)}% of project`
              : ""
          }
          accent="#3b82f6"
        />
        <KpiCard
          label="Loan Remaining"
          value={short(Math.max(0, job.loanAmount - job.drawnToDate))}
          sub={`of ${short(job.loanAmount)} loan`}
          accent={
            job.loanAmount - job.drawnToDate < 1_000_000
              ? "#f59e0b"
              : "#22c55e"
          }
        />
        <KpiCard
          label="Equity Remaining"
          value={short(
            Math.max(
              0,
              job.totalProjectCost -
                job.drawnToDate -
                Math.max(0, job.loanAmount - job.drawnToDate)
            )
          )}
          sub="to complete project"
          accent="#ff4757"
        />

        {/* Completion gauge — editable */}
        <div className="relative rounded-2xl bg-chassis p-5 shadow-card overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <Stamp>Completion</Stamp>
            <LED color="blue" size={8} pulse />
          </div>
          <div className="flex items-end gap-2">
            <input
              type="number"
              value={job.completion}
              onChange={(e) =>
                updateProperty(job.id, { completion: e.target.value })
              }
              min="0"
              max="100"
              className="w-[72px] text-right bg-chassis rounded-md px-2 py-1.5 text-2xl font-mono font-bold text-[#1e40af] shadow-recessed-sm border-none outline-none focus-visible:shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff,0_0_0_2px_var(--accent)]"
            />
            <span className="text-xl font-mono font-bold text-[#1e40af] pb-1">
              %
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={job.completion}
              max={100}
              color="#3b82f6"
              height={5}
            />
          </div>
        </div>
      </div>

      {/* Breakdown + Top vendors */}
      <div className="grid-2 mb-6">
        <div className="rounded-2xl bg-chassis shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(74,85,104,0.08)]">
            <div className="flex items-center gap-3">
              <Stamp>
                {selectedDraw ? `Draw #${selectedDraw.num}` : "All Draws"} — by{" "}
                {viewMode === "vendor" ? "Vendor" : "Category"}
              </Stamp>
              {selectedDraw && (
                <button
                  onClick={() => setSelectedDraw(null)}
                  className="press flex items-center gap-1 px-2 py-1 rounded-md bg-chassis shadow-recessed-sm text-[9px] font-mono uppercase tracking-[0.08em] font-bold text-label hover:text-ink"
                >
                  <XIcon className="h-2.5 w-2.5" />
                  Show All
                </button>
              )}
            </div>
            <SegmentToggle
              value={viewMode}
              onChange={setViewMode}
              options={[
                {
                  value: "vendor",
                  label: "Vendor",
                  icon: <Tag className="h-3 w-3" strokeWidth={1.8} />,
                },
                {
                  value: "category",
                  label: "Category",
                  icon: <LayoutList className="h-3 w-3" strokeWidth={1.8} />,
                },
              ]}
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loadingInvoices && selectedDraw ? (
              <div className="p-10 flex items-center justify-center gap-2 text-label">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Stamp>Loading...</Stamp>
              </div>
            ) : (viewMode === "vendor" ? vendorList : categoryList).length ===
              0 ? (
              <div className="p-10 text-center">
                <Stamp className="text-label/70">No invoice data</Stamp>
              </div>
            ) : (
              (viewMode === "vendor" ? vendorList : categoryList).map(
                (item, i) => {
                  const name =
                    viewMode === "vendor" ? item.vendor : item.category;
                  const p = breakdownTotal > 0 ? pct(item.total, breakdownTotal) : 0;
                  return (
                    <div
                      key={name}
                      className="group flex items-center gap-3 px-6 py-3 border-b border-[rgba(74,85,104,0.05)] last:border-none hover:bg-white/30 transition-colors"
                    >
                      <div
                        className="h-2 w-2 rounded-sm shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-ink truncate">
                          {name}
                        </div>
                        <div className="mt-0.5 text-[10px] font-mono text-label">
                          {item.count} payment{item.count !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Mono className="text-[13px] font-bold text-ink">
                          {fc(item.total)}
                        </Mono>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <div
                            className="w-[50px] h-1 rounded-full bg-chassis overflow-hidden"
                            style={{
                              boxShadow:
                                "inset 1px 1px 2px rgba(186,190,204,0.9)",
                            }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${p}%`,
                                background: COLORS[i % COLORS.length],
                              }}
                            />
                          </div>
                          <Mono className="text-[10px] text-label">{p}%</Mono>
                        </div>
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
          {breakdownTotal > 0 && (
            <div className="flex justify-between items-center px-6 py-3 border-t border-[rgba(74,85,104,0.08)]"
              style={{
                boxShadow: "inset 0 2px 4px rgba(186,190,204,0.4)",
              }}
            >
              <Stamp className="text-[9px]">
                {viewMode === "vendor"
                  ? `${vendorList.length} vendors`
                  : `${categoryList.length} categories`}{" "}
                · {invoicesToShow.length} txns
              </Stamp>
              <Mono className="text-[13px] font-bold text-accent">
                {fc(breakdownTotal)}
              </Mono>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-chassis p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <Stamp>Top Vendors · {job.shortName}</Stamp>
            <LED color="accent" size={8} pulse />
          </div>
          {vendorList.slice(0, 8).map((v, i) => (
            <div
              key={v.vendor}
              className="flex items-center justify-between py-2.5 border-b border-[rgba(74,85,104,0.05)] last:border-none"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="font-mono text-[10px] font-bold text-label/70 w-4">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="text-[12px] font-semibold text-ink truncate">
                  {v.vendor}
                </div>
              </div>
              <Mono className="text-[12px] font-bold text-accent ml-3">
                {fc(v.total)}
              </Mono>
            </div>
          ))}
          {vendorList.length === 0 && (
            <div className="text-center py-6">
              <Stamp className="text-label/70">No vendor data yet</Stamp>
            </div>
          )}
        </div>
      </div>

      {/* Draw history table */}
      <div className="rounded-2xl bg-chassis shadow-card overflow-hidden table-wrap">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(74,85,104,0.08)]">
          <Stamp>Draw History · {job.name}</Stamp>
          <Mono className="text-[11px] text-label">
            {fc((job.draws || []).reduce((s, d) => s + d.amount, 0))} total ·{" "}
            {(job.draws || []).length} draws
          </Mono>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Draw", "Amount", "Invoices", "Submitted", "Funded", "Status", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-label"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {(job.draws || []).map((d) => {
              const isSelected = selectedDraw?.id === d.id;
              const nextStage = NEXT_STAGE[d.status];
              return (
                <tr
                  key={d.num}
                  onClick={() => handleDrawClick(d)}
                  className={
                    "border-t border-[rgba(74,85,104,0.05)] cursor-pointer transition-colors " +
                    (isSelected ? "bg-white/40" : "hover:bg-white/25")
                  }
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <Mono
                        className={
                          "text-[13px] font-bold " +
                          (isSelected ? "text-accent" : "text-ink")
                        }
                      >
                        #{d.num}
                      </Mono>
                      {isSelected && (
                        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-accent">
                          SELECTED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <Mono className="text-[13px] font-bold text-accent">
                      {fc(d.amount)}
                    </Mono>
                  </td>
                  <td className="px-6 py-3.5 text-[12px] font-mono text-label">
                    {d.invoices}
                  </td>
                  <td className="px-6 py-3.5 text-[12px] font-mono text-label">
                    {d.submitted || <span className="text-label/50">—</span>}
                  </td>
                  <td
                    className={
                      "px-6 py-3.5 text-[12px] font-mono " +
                      (d.funded ? "text-[#15803d] font-semibold" : "text-label/50")
                    }
                  >
                    {d.funded || "—"}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusDot status={d.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {nextStage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdvance(d.num, d.status);
                        }}
                        className="press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-chassis shadow-card text-[10px] font-mono uppercase tracking-[0.08em] font-bold text-accent hover:shadow-floating whitespace-nowrap"
                      >
                        {NEXT_LABEL[d.status]}
                        <ArrowRight className="h-2.5 w-2.5" strokeWidth={2.5} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div
          className="flex justify-between items-center px-6 py-3 border-t border-[rgba(74,85,104,0.08)]"
          style={{
            boxShadow: "inset 0 2px 4px rgba(186,190,204,0.4)",
          }}
        >
          <Stamp className="text-[9px]">Cumulative drawn</Stamp>
          <Mono className="text-[12px] font-bold text-accent">
            {fc(job.drawnToDate)} of {fc(job.loanAmount)}
          </Mono>
        </div>
      </div>
    </div>
  );
}
