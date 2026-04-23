import React, { useState, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Upload,
  Loader2,
  FileText,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { fc, pct, Mono, Badge, ChartTip, COLORS } from "../utils/format";
import { extractInvoices } from "../utils/extraction";
import { mapTrade, getTradeCategories } from "../utils/tradeMap";
import { useJobs } from "../context/JobsContext";
import { authFetch, supabase } from "../utils/supabase";
import { Button } from "./ui/Button";
import { Stamp } from "./ui/Typography";
import { LED } from "./ui/LED";

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

function RowInput({ value, onChange, className = "", ...rest }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        "w-full rounded-md bg-chassis px-3 py-2 text-[12px] font-mono text-ink shadow-recessed-sm border-none outline-none transition-shadow focus-visible:shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff,0_0_0_2px_var(--accent)] " +
        className
      }
      {...rest}
    />
  );
}

function RowSelect({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        "w-full rounded-md bg-chassis px-3 py-2 text-[12px] font-mono text-ink shadow-recessed-sm border-none outline-none appearance-none cursor-pointer focus-visible:shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff,0_0_0_2px_var(--accent)] " +
        className
      }
    >
      {children}
    </select>
  );
}

function EmptyState({ children }) {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-chassis shadow-recessed-sm">
          <LED color="amber" size={8} pulse />
          <Stamp>{children}</Stamp>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesView({ jobId, drawNum }) {
  const { builds, commitExtraction } = useJobs();
  const [selectedJob, setSelectedJob] = useState(jobId || builds[0]?.id);
  const effectiveJobId = jobId || selectedJob;
  const job = builds.find((j) => j.id === effectiveJobId) || builds[0];

  useEffect(() => {
    if (jobId) setSelectedJob(jobId);
  }, [jobId]);
  const jobDraws = job?.draws || [];
  const fallbackDraw = jobDraws[jobDraws.length - 1];
  const targetDraw =
    drawNum != null
      ? jobDraws.find((d) => d.num === drawNum) || fallbackDraw
      : fallbackDraw;

  const fileRef = useRef(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Load saved invoices whenever the targeted draw changes (so editing a
  // historical draw pre-populates the editable table).
  useEffect(() => {
    if (!targetDraw?.id) {
      setExtracted(null);
      setSaved(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("invoices")
      .select("*")
      .eq("draw_id", targetDraw.id)
      .order("created_at")
      .then(({ data, error: loadErr }) => {
        if (cancelled) return;
        if (loadErr || !data) {
          setExtracted(null);
          return;
        }
        if (data.length === 0) {
          setExtracted(null);
          return;
        }
        const loaded = data.map((row, i) => ({
          id: i,
          dbId: row.id,
          vendor: row.vendor || "",
          invoiceNumber: row.invoice_number || "",
          invoiceDate: row.invoice_date || "",
          amountDue: parseFloat(row.amount_due) || 0,
          jobName: row.job_name || "",
          tradeCategory: row.trade_category || "General Construction",
          invoiceType: row.invoice_type || "standard",
          missingDataFlag: row.missing_data_flag || null,
        }));
        setExtracted(loaded);
        setSaved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [targetDraw?.id]);

  if (!job) return <EmptyState>Add a build property to start</EmptyState>;
  if (!targetDraw)
    return (
      <EmptyState>
        No draws for {job.shortName} — create one from the Draws tab
      </EmptyState>
    );

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setError(null);
    setSaved(false);
    try {
      const { invoices } = await extractInvoices(file);
      const baseId = (extracted || []).reduce(
        (m, inv) => Math.max(m, typeof inv.id === "number" ? inv.id : -1),
        -1
      );
      const normalized = invoices.map((inv, i) => ({
        ...inv,
        id: baseId + 1 + i,
        tradeCategory: mapTrade(inv.tradeCategory),
      }));
      let newRows = normalized;
      try {
        const dupRes = await authFetch("/api/check-duplicates", {
          method: "POST",
          body: JSON.stringify({ invoices: normalized }),
        });
        if (dupRes.ok) {
          const { invoices: checked } = await dupRes.json();
          newRows = checked;
        }
      } catch (_) {
        // fall back to normalized
      }
      setExtracted((prev) => [...(prev || []), ...newRows]);
    } catch (err) {
      setError(err.message);
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateInvoice = (id, field, value) => {
    setExtracted((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              [field]: field === "amountDue" ? parseFloat(value) || 0 : value,
            }
          : inv
      )
    );
    setSaved(false);
  };

  const removeInvoice = (id) => {
    setExtracted((prev) => (prev || []).filter((inv) => inv.id !== id));
    setSaved(false);
  };

  const handleSaveToDraw = () => {
    if (!extracted) return;
    commitExtraction(job.id, targetDraw.num, extracted);
    setSaved(true);
  };

  const tradeGroups = extracted
    ? Object.entries(
        extracted.reduce((acc, inv) => {
          const cat = inv.tradeCategory || "Other";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(inv);
          return acc;
        }, {})
      )
        .map(([trade, invoices]) => ({
          trade,
          amount: invoices.reduce((s, inv) => s + inv.amountDue, 0),
          invoices,
        }))
        .sort((a, b) => b.amount - a.amount)
    : null;

  const savedInvoices = targetDraw.extractedInvoices;
  const staticBreakdown = job.tradeBreakdown || [];
  const displayData = tradeGroups
    ? tradeGroups.map((g) => ({ trade: g.trade, amount: g.amount }))
    : staticBreakdown;
  const displayTotal = (displayData || []).reduce((s, t) => s + t.amount, 0);

  const extractionStats = extracted
    ? {
        count: extracted.length,
        total: extracted.reduce((s, inv) => s + inv.amountDue, 0),
      }
    : {
        count: targetDraw.invoices,
        total: targetDraw.amount,
      };

  const exportCsv = () => {
    const data = extracted || savedInvoices;
    if (!data) return;
    const rows = data.map((inv) => [
      `"${(inv.vendor || "").replace(/"/g, '""')}"`,
      `"${(inv.invoiceNumber || "").replace(/"/g, '""')}"`,
      (inv.amountDue || 0).toFixed(2),
      `"${mapTrade(inv.tradeCategory).replace(/"/g, '""')}"`,
      `"${(inv.invoiceDate || "").replace(/"/g, '""')}"`,
    ]);
    const csv =
      "Vendor,Invoice #,Amount,Category,Date\n" +
      rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${job.shortName}_Draw${targetDraw.num}_Disbursement.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tradeCategories = getTradeCategories();
  const duplicatesCount =
    extracted?.filter((inv) => inv.duplicate).length || 0;

  return (
    <div className="max-w-[1400px] mx-auto">
      {!jobId && (
        <div className="inline-flex items-center gap-1 mb-6 p-1 rounded-xl bg-chassis shadow-recessed">
          {builds.map((j) => (
            <PillTab
              key={j.id}
              active={selectedJob === j.id}
              onClick={() => {
                setSelectedJob(j.id);
                setExtracted(null);
                setError(null);
                setSaved(false);
              }}
            >
              {j.shortName}
            </PillTab>
          ))}
        </div>
      )}

      <div className="grid-2-sidebar">
        <div>
          {/* Upload zone */}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,application/zip,application/x-zip-compressed,.pdf,.zip"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div
            onClick={() => !extracting && fileRef.current?.click()}
            className={
              "relative mb-5 rounded-2xl bg-chassis p-8 text-center transition-all duration-300 ease-mechanical screws overflow-hidden " +
              (extracting
                ? "shadow-pressed cursor-wait"
                : "shadow-card cursor-pointer hover:-translate-y-0.5 hover:shadow-floating")
            }
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.4) 0%, transparent 50%)",
            }}
          >
            {extracting ? (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-chassis shadow-pressed">
                  <Loader2
                    className="h-6 w-6 text-accent animate-spin"
                    strokeWidth={2}
                  />
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <LED color="accent" size={8} pulse />
                  <Stamp className="text-accent">Extracting...</Stamp>
                </div>
                <div className="text-[11px] font-mono text-label">
                  Processing PDF with Claude
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-chassis shadow-floating">
                  <Upload
                    className="h-5 w-5 text-accent"
                    strokeWidth={1.8}
                  />
                </div>
                <div className="text-[14px] font-bold text-ink emboss mb-1">
                  Upload Invoice Batch (PDF or ZIP)
                </div>
                <div className="text-[11px] font-mono text-label mb-4">
                  Drag & drop a single PDF or a ZIP of PDFs
                </div>
                <Button variant="primary" size="md">
                  <FileText className="h-3.5 w-3.5 mr-2" /> Select File
                </Button>
              </>
            )}
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-chassis shadow-recessed-sm">
              <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
              <span className="font-mono text-xs text-[#b91c1c]">{error}</span>
            </div>
          )}

          {duplicatesCount > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-chassis shadow-recessed-sm">
              <LED color="amber" size={10} pulse />
              <span className="font-mono text-[12px] text-[#b45309]">
                <strong>{duplicatesCount} possible duplicate{duplicatesCount !== 1 ? "s" : ""}</strong>{" "}
                found in previous draws — review flagged rows before saving.
              </span>
            </div>
          )}

          {/* Trade breakdown table */}
          <div className="rounded-2xl bg-chassis shadow-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[rgba(74,85,104,0.08)]">
              <Stamp>
                Trade Breakdown · {job.shortName} Draw #{targetDraw.num}
              </Stamp>
              <div className="flex items-center gap-3">
                {extracted && !saved && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveToDraw}
                    iconLeft={<Check className="h-3 w-3" strokeWidth={2.5} />}
                  >
                    Save
                  </Button>
                )}
                {saved && (
                  <span className="inline-flex items-center gap-2 rounded-md bg-chassis px-2.5 py-1 shadow-recessed-sm">
                    <CheckCircle2 className="h-3 w-3 text-[#22c55e]" />
                    <Stamp className="text-[9px] text-[#15803d]">Saved</Stamp>
                  </span>
                )}
                {(extracted || savedInvoices) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportCsv}
                    iconLeft={<Download className="h-3 w-3" />}
                  >
                    CSV
                  </Button>
                )}
                <Mono className="text-[12px] font-bold text-accent">
                  {fc(displayTotal)}
                </Mono>
              </div>
            </div>
            <div className="table-wrap">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {(extracted
                      ? ["Trade Category", "Vendor", "Amount", "Type", ""]
                      : ["Trade Category", "Amount", "% of Draw", ""]
                    ).map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-label"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extracted
                    ? tradeGroups.map((group, gi) =>
                        group.invoices.map((inv, ii) => {
                          const isFirst = ii === 0;
                          return (
                            <tr
                              key={inv.id}
                              className="border-t border-[rgba(74,85,104,0.05)] hover:bg-white/30 transition-colors"
                            >
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  {isFirst ? (
                                    <div
                                      className="h-2 w-2 rounded-sm shrink-0"
                                      style={{
                                        background: COLORS[gi % COLORS.length],
                                      }}
                                    />
                                  ) : (
                                    <div className="w-2" />
                                  )}
                                  <RowSelect
                                    value={inv.tradeCategory}
                                    onChange={(v) =>
                                      updateInvoice(inv.id, "tradeCategory", v)
                                    }
                                    className="min-w-[140px]"
                                  >
                                    {tradeCategories.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                    {!tradeCategories.includes(
                                      inv.tradeCategory
                                    ) && (
                                      <option value={inv.tradeCategory}>
                                        {inv.tradeCategory}
                                      </option>
                                    )}
                                  </RowSelect>
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <RowInput
                                  value={inv.vendor}
                                  onChange={(v) =>
                                    updateInvoice(inv.id, "vendor", v)
                                  }
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <RowInput
                                  type="number"
                                  value={inv.amountDue}
                                  onChange={(v) =>
                                    updateInvoice(inv.id, "amountDue", v)
                                  }
                                  step="0.01"
                                  className="text-right max-w-[110px]"
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex flex-col gap-1.5">
                                  <Badge
                                    label={
                                      inv.invoiceType === "pay_application"
                                        ? "Pay App"
                                        : inv.invoiceType === "statement_line"
                                        ? "Statement"
                                        : "Invoice"
                                    }
                                    ledColor={
                                      inv.invoiceType === "pay_application"
                                        ? "amber"
                                        : inv.invoiceType === "statement_line"
                                        ? "purple"
                                        : null
                                    }
                                  />
                                  {inv.missingDataFlag && (
                                    <Badge
                                      label={
                                        inv.missingDataFlag.length > 20
                                          ? inv.missingDataFlag.slice(0, 20) +
                                            "..."
                                          : inv.missingDataFlag
                                      }
                                      ledColor="red"
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {inv.duplicate ? (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <Badge
                                        label={
                                          inv.duplicateExact
                                            ? "Duplicate"
                                            : "Possible Match"
                                        }
                                        ledColor="red"
                                      />
                                      {inv.duplicateRefs &&
                                        inv.duplicateRefs[0] && (
                                          <span className="font-mono text-[9px] text-label whitespace-nowrap">
                                            Draw #
                                            {inv.duplicateRefs[0].drawNum}
                                            {!inv.duplicateAmountMatches &&
                                              " (amt diff)"}
                                          </span>
                                        )}
                                    </div>
                                  ) : inv.dbId ? (
                                    <Badge label="Saved" ledColor="blue" />
                                  ) : (
                                    <Badge label="New" ledColor="green" />
                                  )}
                                  <button
                                    onClick={() => removeInvoice(inv.id)}
                                    className="press rounded-md p-1.5 text-label hover:text-[#b91c1c] shadow-recessed-sm"
                                    title="Remove row"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )
                    : staticBreakdown.map((t, i) => {
                        const p =
                          displayTotal > 0 ? pct(t.amount, displayTotal) : 0;
                        return (
                          <tr
                            key={t.trade}
                            className="border-t border-[rgba(74,85,104,0.05)] hover:bg-white/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2 w-2 rounded-sm shrink-0"
                                  style={{
                                    background: COLORS[i % COLORS.length],
                                  }}
                                />
                                <span className="text-[12px] font-semibold text-ink">
                                  {t.trade}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Mono className="text-[13px] font-bold text-ink">
                                {fc(t.amount)}
                              </Mono>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-1 rounded-full bg-chassis overflow-hidden max-w-[80px] flex-1"
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
                                <Mono className="text-[11px] text-label">
                                  {p}%
                                </Mono>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge label="Ready" ledColor="green" />
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl bg-chassis p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <Stamp>Trade Distribution</Stamp>
              <LED color="accent" size={8} pulse />
            </div>
            {displayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={displayData}
                    dataKey="amount"
                    nameKey="trade"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {displayData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <Stamp className="text-label/70">No trade data yet</Stamp>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-chassis p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <Stamp>Invoice Summary</Stamp>
              <LED color="green" size={8} pulse />
            </div>
            {[
              {
                label: "Invoices Found",
                value: extractionStats.count,
                color: "text-ink",
              },
              {
                label: "Total Amount",
                value: fc(extractionStats.total),
                color: "text-accent",
              },
            ].map((s, i) => (
              <div
                key={s.label}
                className={
                  "flex justify-between items-center py-3 " +
                  (i === 0 ? "border-b border-[rgba(74,85,104,0.08)]" : "")
                }
              >
                <Stamp className="text-[10px]">{s.label}</Stamp>
                <Mono className={"text-[14px] font-bold " + s.color}>
                  {s.value}
                </Mono>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
