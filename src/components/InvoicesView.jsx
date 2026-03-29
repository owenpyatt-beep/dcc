import React, { useState, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { T } from "../data/jobs";
import { fc, pct, Mono, Badge, ChartTip, COLORS } from "../utils/format";
import { extractInvoices, fileToBase64 } from "../utils/extraction";
import { mapTrade, getTradeCategories } from "../utils/tradeMap";
import { useJobs } from "../context/JobsContext";

export default function InvoicesView() {
  const { jobs, commitExtraction } = useJobs();
  const [selectedJob, setSelectedJob] = useState(jobs[0]?.id);
  const job = jobs.find((j) => j.id === selectedJob) || jobs[0];
  const currentDraw = job?.draws[job.draws.length - 1];

  const fileRef = useRef(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  if (!job || !currentDraw) return null;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setError(null);
    setExtracted(null);
    setSaved(false);
    try {
      const base64 = await fileToBase64(file);
      const invoices = await extractInvoices(base64);
      setExtracted(
        invoices.map((inv) => ({
          ...inv,
          tradeCategory: mapTrade(inv.tradeCategory),
        }))
      );
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

  const handleSaveToDraw = () => {
    if (!extracted) return;
    commitExtraction(job.id, currentDraw.num, extracted);
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

  const savedInvoices = currentDraw.extractedInvoices;
  const staticBreakdown = job.tradeBreakdown;
  const displayData = tradeGroups
    ? tradeGroups.map((g) => ({ trade: g.trade, amount: g.amount }))
    : staticBreakdown;
  const displayTotal = displayData.reduce((s, t) => s + t.amount, 0);

  const extractionStats = extracted
    ? {
        count: extracted.length,
        total: extracted.reduce((s, inv) => s + inv.amountDue, 0),
        accuracy: null,
      }
    : {
        count: currentDraw.invoices,
        total: currentDraw.amount,
        accuracy: currentDraw.accuracy,
      };

  const exportCsv = () => {
    const data = extracted || savedInvoices;
    if (!data) return;
    const rows = data.map((inv) => [
      `"${(inv.vendor || "").replace(/"/g, '""')}"`,
      `"${(inv.invoiceNumber || "").replace(/"/g, '""')}"`,
      `"${(inv.invoiceDate || "").replace(/"/g, '""')}"`,
      (inv.amountDue || 0).toFixed(2),
      `"${(inv.jobName || "").replace(/"/g, '""')}"`,
      `"${mapTrade(inv.tradeCategory).replace(/"/g, '""')}"`,
    ]);
    const csv =
      "vendor,invoiceNumber,invoiceDate,amountDue,jobName,tradeCategory\n" +
      rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${job.shortName}_Draw${currentDraw.num}_invoices.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tradeCategories = getTradeCategories();

  const inputStyle = {
    background: T.bg4,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    color: T.text0,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    padding: "4px 8px",
    outline: "none",
    width: "100%",
  };

  const monoInputStyle = {
    ...inputStyle,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: "right",
    width: 100,
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          background: T.bg2,
          borderRadius: 10,
          padding: 4,
          border: `1px solid ${T.border}`,
          width: "fit-content",
        }}
      >
        {jobs.map((j) => (
          <button
            key={j.id}
            onClick={() => {
              setSelectedJob(j.id);
              setExtracted(null);
              setError(null);
              setSaved(false);
            }}
            style={{
              background: selectedJob === j.id ? T.bg4 : "transparent",
              border:
                selectedJob === j.id
                  ? `1px solid ${T.border}`
                  : "1px solid transparent",
              color: selectedJob === j.id ? T.text0 : T.text2,
              fontSize: 12,
              fontWeight: 600,
              padding: "7px 18px",
              borderRadius: 7,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {j.shortName}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 18,
        }}
      >
        <div>
          {/* Upload zone */}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <div
            onClick={() => !extracting && fileRef.current?.click()}
            style={{
              background: extracting ? T.bg3 : T.bg2,
              border: `1px dashed ${T.goldBorder}`,
              borderRadius: 10,
              padding: "28px 24px",
              marginBottom: 18,
              textAlign: "center",
              cursor: extracting ? "wait" : "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!extracting) e.currentTarget.style.background = T.bg3;
            }}
            onMouseLeave={(e) => {
              if (!extracting) e.currentTarget.style.background = T.bg2;
            }}
          >
            {extracting ? (
              <>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    margin: "0 auto 10px",
                    display: "block",
                    animation: "spin 1.2s linear infinite",
                  }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke={T.gold}
                    strokeWidth="2"
                    strokeDasharray="28 14"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                </svg>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.gold,
                    marginBottom: 4,
                  }}
                >
                  Extracting invoices...
                </div>
                <div style={{ fontSize: 11, color: T.text2 }}>
                  Processing PDF with Claude
                </div>
              </>
            ) : (
              <>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    margin: "0 auto 10px",
                    display: "block",
                  }}
                >
                  <rect
                    x="4"
                    y="2"
                    width="12"
                    height="16"
                    rx="2"
                    stroke={T.gold}
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                  <path
                    d="M16 2l4 4"
                    stroke={T.gold}
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                  <path
                    d="M16 2v4h4"
                    stroke={T.gold}
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                  <path
                    d="M9 12v5M9 12l-2 2M9 12l2 2"
                    stroke={T.gold}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.text1,
                    marginBottom: 4,
                  }}
                >
                  Upload Invoice Batch PDF
                </div>
                <div style={{ fontSize: 11, color: T.text2 }}>
                  Drag & drop or click — multi-page PDFs supported
                </div>
                <div
                  style={{
                    display: "inline-block",
                    marginTop: 14,
                    padding: "7px 20px",
                    background: T.goldDim,
                    border: `1px solid ${T.goldBorder}`,
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    color: T.gold,
                  }}
                >
                  Select File
                </div>
              </>
            )}
          </div>

          {error && (
            <div
              style={{
                background: T.redDim,
                border: `1px solid ${T.red}44`,
                borderRadius: 8,
                padding: "12px 18px",
                marginBottom: 18,
                fontSize: 12,
                color: T.red,
              }}
            >
              {error}
            </div>
          )}

          {/* Trade breakdown table */}
          <div
            style={{
              background: T.bg2,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  color: T.text2,
                }}
              >
                Trade Breakdown — {job.shortName} Draw #{currentDraw.num}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {extracted && !saved && (
                  <button
                    onClick={handleSaveToDraw}
                    style={{
                      background: T.greenDim,
                      border: `1px solid ${T.green}44`,
                      borderRadius: 6,
                      color: T.green,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "5px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "inherit",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Save to Draw
                  </button>
                )}
                {saved && (
                  <Badge label="Saved" color={T.green} bg={T.greenDim} />
                )}
                {(extracted || savedInvoices) && (
                  <button
                    onClick={exportCsv}
                    style={{
                      background: T.goldDim,
                      border: `1px solid ${T.goldBorder}`,
                      borderRadius: 6,
                      color: T.gold,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "5px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "inherit",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Export CSV
                  </button>
                )}
                <Mono style={{ fontSize: 12, color: T.text2 }}>
                  {fc(displayTotal)}
                </Mono>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {(extracted
                    ? ["Trade Category", "Vendor", "Amount", "% of Total", ""]
                    : ["Trade Category", "Amount", "% of Draw", ""]
                  ).map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "10px 24px",
                        textAlign: "left",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: T.text3,
                      }}
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
                        const isLast =
                          gi === tradeGroups.length - 1 &&
                          ii === group.invoices.length - 1;
                        const p = displayTotal > 0 ? pct(inv.amountDue, displayTotal) : 0;
                        const isFirst = ii === 0;
                        return (
                          <tr
                            key={inv.id}
                            style={{
                              borderBottom: isLast
                                ? "none"
                                : `1px solid ${T.bg3}`,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = T.bg3)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                "transparent")
                            }
                          >
                            <td style={{ padding: "10px 24px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  paddingLeft: isFirst ? 0 : 16,
                                }}
                              >
                                {isFirst && (
                                  <div
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: 2,
                                      background:
                                        COLORS[gi % COLORS.length],
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <select
                                  value={inv.tradeCategory}
                                  onChange={(e) =>
                                    updateInvoice(
                                      inv.id,
                                      "tradeCategory",
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    ...inputStyle,
                                    width: "auto",
                                    minWidth: 140,
                                  }}
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
                                </select>
                              </div>
                            </td>
                            <td style={{ padding: "10px 24px" }}>
                              <input
                                type="text"
                                value={inv.vendor}
                                onChange={(e) =>
                                  updateInvoice(
                                    inv.id,
                                    "vendor",
                                    e.target.value
                                  )
                                }
                                style={inputStyle}
                              />
                            </td>
                            <td style={{ padding: "10px 24px" }}>
                              <input
                                type="number"
                                value={inv.amountDue}
                                onChange={(e) =>
                                  updateInvoice(
                                    inv.id,
                                    "amountDue",
                                    e.target.value
                                  )
                                }
                                style={monoInputStyle}
                                step="0.01"
                              />
                            </td>
                            <td style={{ padding: "10px 24px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    height: 3,
                                    borderRadius: 2,
                                    background: T.bg4,
                                    overflow: "hidden",
                                    maxWidth: 80,
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${p}%`,
                                      background:
                                        COLORS[gi % COLORS.length],
                                    }}
                                  />
                                </div>
                                <Mono
                                  style={{
                                    fontSize: 11,
                                    color: T.text2,
                                  }}
                                >
                                  {p}%
                                </Mono>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "10px 24px",
                                textAlign: "right",
                              }}
                            >
                              <Badge
                                label="Extracted"
                                color={T.blue}
                                bg={T.blueDim}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )
                  : staticBreakdown.map((t, i) => {
                      const p = displayTotal > 0 ? pct(t.amount, displayTotal) : 0;
                      return (
                        <tr
                          key={t.trade}
                          style={{
                            borderBottom:
                              i < staticBreakdown.length - 1
                                ? `1px solid ${T.bg3}`
                                : "none",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = T.bg3)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "transparent")
                          }
                        >
                          <td style={{ padding: "12px 24px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  background:
                                    COLORS[i % COLORS.length],
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 12,
                                  color: T.text1,
                                }}
                              >
                                {t.trade}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 24px" }}>
                            <Mono
                              style={{
                                fontSize: 13,
                                color: T.text0,
                                fontWeight: 700,
                              }}
                            >
                              {fc(t.amount)}
                            </Mono>
                          </td>
                          <td style={{ padding: "12px 24px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  height: 3,
                                  borderRadius: 2,
                                  background: T.bg4,
                                  overflow: "hidden",
                                  maxWidth: 80,
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${p}%`,
                                    background:
                                      COLORS[i % COLORS.length],
                                  }}
                                />
                              </div>
                              <Mono
                                style={{
                                  fontSize: 11,
                                  color: T.text2,
                                }}
                              >
                                {p}%
                              </Mono>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 24px",
                              textAlign: "right",
                            }}
                          >
                            <Badge
                              label="Ready"
                              color={T.green}
                              bg={T.greenDim}
                            />
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: T.bg2,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: T.text2,
                marginBottom: 16,
              }}
            >
              Trade Distribution
            </div>
            {displayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={displayData}
                    dataKey="amount"
                    nameKey="trade"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {displayData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: T.text3 }}>
                No trade data yet
              </div>
            )}
          </div>
          <div
            style={{
              background: T.bg2,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: T.text2,
                marginBottom: 16,
              }}
            >
              Extraction Stats
            </div>
            {[
              {
                label: "Invoices Processed",
                value: extractionStats.count,
                color: T.text0,
              },
              {
                label: "Total Extracted",
                value: fc(extractionStats.total),
                color: T.gold,
              },
              {
                label: "Accuracy",
                value: extractionStats.accuracy
                  ? `${extractionStats.accuracy}%`
                  : extracted
                  ? "Pending review"
                  : "\u2014",
                color: extractionStats.accuracy ? T.green : T.text2,
              },
              {
                label: "Extraction Error",
                value: extractionStats.accuracy
                  ? fc(
                      extractionStats.total *
                        (1 - extractionStats.accuracy / 100)
                    )
                  : "\u2014",
                color: T.text2,
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: `1px solid ${T.bg3}`,
                }}
              >
                <span style={{ fontSize: 12, color: T.text2 }}>
                  {s.label}
                </span>
                <Mono
                  style={{
                    fontSize: 12,
                    color: s.color,
                    fontWeight: 700,
                  }}
                >
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
