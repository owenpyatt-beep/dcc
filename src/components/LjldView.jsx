import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Loader2,
  FileText,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  MessageCircle,
  Send,
  CheckCircle2,
} from "lucide-react";
import { fc, Mono } from "../utils/format";
import { fileToBase64 } from "../utils/extraction";
import { authFetch, supabase } from "../utils/supabase";
import { useJobs } from "../context/JobsContext";
import { Button } from "./ui/Button";
import { Stamp } from "./ui/Typography";
import { LED } from "./ui/LED";

function TextField({ value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={
        "w-full rounded-md bg-chassis px-3 py-2 text-[12px] font-mono text-ink shadow-recessed-sm border-none outline-none transition-shadow focus-visible:shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff,0_0_0_2px_var(--accent)] " +
        className
      }
    />
  );
}

function Select({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value ?? ""}
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

function todayIso() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function nextInvoiceNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `LJLD-${stamp}-${suffix}`;
}

export default function LjldView() {
  const { properties, builds } = useJobs();

  const [propertyId, setPropertyId] = useState("");
  const [drawId, setDrawId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber());
  const [invoiceDate, setInvoiceDate] = useState(todayIso());
  const [taxRate, setTaxRate] = useState("0");
  const [other, setOther] = useState("0");

  const [items, setItems] = useState([]);
  const [issues, setIssues] = useState([]);
  const [resolvedIssues, setResolvedIssues] = useState(new Set());
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [propertyDraws, setPropertyDraws] = useState([]);
  const fileRef = useRef(null);

  // Default to first build property
  useEffect(() => {
    if (!propertyId && builds.length > 0) {
      setPropertyId(builds[0].id);
    }
  }, [builds, propertyId]);

  // Load draws for selected property
  useEffect(() => {
    if (!propertyId) {
      setPropertyDraws([]);
      return;
    }
    supabase
      .from("draws")
      .select("id, num, status")
      .eq("property_id", propertyId)
      .order("num", { ascending: false })
      .then(({ data }) => {
        setPropertyDraws(data || []);
        if (data && data.length > 0) {
          setDrawId((current) => current || data[0].id);
        }
      });
  }, [propertyId]);

  const property = properties.find((p) => p.id === propertyId);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0),
    [items]
  );
  const total = useMemo(() => {
    const tax = parseFloat(taxRate) || 0;
    const oth = parseFloat(other) || 0;
    return subtotal * (1 + tax) + oth;
  }, [subtotal, taxRate, other]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const base64 = await fileToBase64(file);
      const isZip =
        file.name.toLowerCase().endsWith(".zip") ||
        file.type.includes("zip");
      const res = await authFetch("/api/ljld-extract", {
        method: "POST",
        body: JSON.stringify(isZip ? { zip: base64 } : { pdf: base64 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Extraction failed (${res.status})`);
      }
      const { items: extracted, issues: reviewed, meta } = await res.json();
      const withIds = (extracted || []).map((it, i) => ({
        ...it,
        localId: `new-${Date.now()}-${i}`,
        id: i,
      }));
      setItems((prev) => [...prev, ...withIds]);
      setIssues((prev) => [...prev, ...(reviewed || [])]);
      setResolvedIssues(new Set());
      setSuccess(
        `Extracted ${withIds.length} line item${withIds.length !== 1 ? "s" : ""} from ${meta?.fileCount || 1} file${
          (meta?.fileCount || 1) !== 1 ? "s" : ""
        }. Review any flagged items below.`
      );
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addManualItem = (type) => {
    const id = Math.max(-1, ...items.map((it) => it.id ?? -1)) + 1;
    setItems((prev) => [
      ...prev,
      {
        localId: `new-${Date.now()}-${id}`,
        id,
        type,
        description: "",
        vendor: type === "prepaid" ? "" : null,
        line_invoice_number: null,
        invoice_date: todayIso(),
        amount: 0,
        flags: [],
        source_file: "manual entry",
      },
    ]);
  };

  const updateItem = (localId, field, value) => {
    setItems((prev) =>
      prev.map((it) =>
        it.localId === localId
          ? {
              ...it,
              [field]: field === "amount" ? parseFloat(value) || 0 : value,
            }
          : it
      )
    );
  };

  const removeItem = (localId) => {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    const newHistory = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await authFetch("/api/ljld-chat", {
        method: "POST",
        body: JSON.stringify({
          items,
          message: msg,
          history: chatHistory,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Chat failed (${res.status})`);
      }
      const { reply } = await res.json();
      setChatHistory([...newHistory, { role: "assistant", content: reply }]);
    } catch (err) {
      setChatHistory([
        ...newHistory,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const finalize = async () => {
    if (!propertyId) {
      setError("Select a property first");
      return;
    }
    if (items.length === 0) {
      setError("Add at least one line item");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      // Persist ljld_invoice + line_items, then ask the server to generate
      const { data: inv, error: insErr } = await supabase
        .from("ljld_invoices")
        .insert({
          property_id: propertyId,
          draw_id: drawId || null,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          status: "draft",
          subtotal,
          tax_rate: parseFloat(taxRate) || 0,
          other: parseFloat(other) || 0,
          total,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      const rows = items.map((it, i) => ({
        ljld_invoice_id: inv.id,
        position: i,
        type: it.type,
        description: it.description || "",
        vendor: it.vendor || null,
        line_invoice_number: it.line_invoice_number || null,
        invoice_date: it.invoice_date || null,
        amount: parseFloat(it.amount) || 0,
        source_file: it.source_file || null,
        flags: it.flags || [],
      }));

      const { error: itemsErr } = await supabase
        .from("ljld_line_items")
        .insert(rows);
      if (itemsErr) throw itemsErr;

      const genRes = await authFetch("/api/ljld-generate", {
        method: "POST",
        body: JSON.stringify({ ljldInvoiceId: inv.id }),
      });

      if (!genRes.ok) {
        const err = await genRes.json().catch(() => ({}));
        throw new Error(err.error || `Generate failed (${genRes.status})`);
      }

      const blob = await genRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = genRes.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ||
        `LJLD_Invoice.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess(
        `Invoice finalized · ${fc(total)} rolled into draw. Template downloaded.`
      );
      // Reset the form
      setItems([]);
      setIssues([]);
      setResolvedIssues(new Set());
      setChatHistory([]);
      setInvoiceNumber(nextInvoiceNumber());
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const activeIssues = issues.filter((iss, i) => !resolvedIssues.has(i));

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="text-2xl font-bold text-ink emboss">LJLD LLC</div>
        <Stamp className="text-[10px] block mt-1">
          Internal GC · Pre-paid invoice builder
        </Stamp>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-chassis shadow-recessed-sm">
          <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
          <span className="font-mono text-xs text-[#b91c1c]">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-chassis shadow-recessed-sm">
          <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
          <span className="font-mono text-xs text-[#15803d]">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div>
          {/* Invoice header fields */}
          <div className="rounded-2xl bg-chassis p-5 shadow-card mb-5">
            <Stamp className="text-[10px] block mb-4">Invoice Details</Stamp>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Stamp className="text-[9px] block mb-1.5">Bill To (Property)</Stamp>
                <Select value={propertyId} onChange={setPropertyId}>
                  <option value="">— Select —</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                {property?.address && (
                  <div className="mt-1 text-[10px] font-mono text-label/70">
                    {property.address}
                  </div>
                )}
              </div>
              <div>
                <Stamp className="text-[9px] block mb-1.5">Attach to Draw</Stamp>
                <Select value={drawId} onChange={setDrawId}>
                  <option value="">— No draw —</option>
                  {propertyDraws.map((d) => (
                    <option key={d.id} value={d.id}>
                      Draw #{d.num} · {d.status}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Stamp className="text-[9px] block mb-1.5">Invoice #</Stamp>
                <TextField value={invoiceNumber} onChange={setInvoiceNumber} />
              </div>
              <div>
                <Stamp className="text-[9px] block mb-1.5">Date</Stamp>
                <TextField
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  placeholder="MM/DD/YYYY"
                />
              </div>
            </div>
          </div>

          {/* Upload zone */}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,application/zip,application/x-zip-compressed,image/png,image/jpeg,image/webp,.pdf,.zip,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={handleUpload}
          />
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className={
              "relative mb-5 rounded-2xl bg-chassis p-6 text-center transition-all ease-mechanical duration-300 " +
              (uploading
                ? "shadow-pressed cursor-wait"
                : "shadow-card cursor-pointer hover:-translate-y-0.5 hover:shadow-floating")
            }
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.4) 0%, transparent 55%)",
            }}
          >
            {uploading ? (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-chassis shadow-pressed">
                  <Loader2 className="h-5 w-5 text-accent animate-spin" />
                </div>
                <Stamp className="text-accent">Extracting…</Stamp>
                <div className="mt-1 text-[11px] font-mono text-label">
                  Claude is reading each receipt
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-chassis shadow-floating">
                  <Upload className="h-4 w-4 text-accent" strokeWidth={1.8} />
                </div>
                <div className="text-[14px] font-bold text-ink emboss">
                  Upload Pre-Paid Receipts
                </div>
                <div className="mt-1 text-[11px] font-mono text-label">
                  ZIP of receipts, single PDF, or image (PNG/JPG)
                </div>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft={<FileText className="h-3 w-3" />}
                  >
                    Select File
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Items table */}
          <div className="rounded-2xl bg-chassis shadow-card overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(74,85,104,0.08)]">
              <Stamp>Line Items · {items.length}</Stamp>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addManualItem("prepaid")}
                  iconLeft={<Plus className="h-3 w-3" />}
                >
                  Prepaid
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addManualItem("labor")}
                  iconLeft={<Plus className="h-3 w-3" />}
                >
                  Labor
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="py-12 text-center">
                <Stamp className="text-label/70">
                  No line items yet — upload receipts or add manually
                </Stamp>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Type", "Description", "Vendor / Invoice #", "Date", "Amount", "Flags", ""].map(
                        (h, i) => (
                          <th
                            key={i}
                            className="px-3 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-label"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr
                        key={it.localId}
                        className="border-t border-[rgba(74,85,104,0.05)] hover:bg-white/30 transition-colors"
                      >
                        <td className="px-3 py-2">
                          <Select
                            value={it.type}
                            onChange={(v) => updateItem(it.localId, "type", v)}
                            className="min-w-[90px]"
                          >
                            <option value="prepaid">Prepaid</option>
                            <option value="labor">Labor</option>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <TextField
                            value={it.description}
                            onChange={(v) => updateItem(it.localId, "description", v)}
                            placeholder="Description"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1.5">
                            <TextField
                              value={it.vendor}
                              onChange={(v) => updateItem(it.localId, "vendor", v)}
                              placeholder={it.type === "labor" ? "—" : "Vendor"}
                            />
                            <TextField
                              value={it.line_invoice_number}
                              onChange={(v) =>
                                updateItem(it.localId, "line_invoice_number", v)
                              }
                              placeholder="Invoice # (optional)"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <TextField
                            value={it.invoice_date}
                            onChange={(v) => updateItem(it.localId, "invoice_date", v)}
                            placeholder="MM/DD/YYYY"
                            className="min-w-[110px]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <TextField
                            value={it.amount}
                            onChange={(v) => updateItem(it.localId, "amount", v)}
                            type="number"
                            className="text-right min-w-[90px]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {(it.flags && it.flags.length > 0) ? (
                            <div className="flex flex-wrap gap-1">
                              {it.flags.map((f, fi) => (
                                <span
                                  key={fi}
                                  className="inline-flex items-center gap-1 rounded-md bg-chassis px-1.5 py-0.5 shadow-recessed-sm"
                                  title={f}
                                >
                                  <LED color="amber" size={6} />
                                  <span className="font-mono text-[9px] text-label whitespace-nowrap">
                                    {f.replace(/_/g, " ")}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="font-mono text-[10px] text-label/50">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeItem(it.localId)}
                            className="press rounded-md p-1.5 text-label hover:text-[#b91c1c]"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="rounded-2xl bg-chassis p-5 shadow-card mb-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Stamp className="text-[9px] block mb-1.5">Tax Rate (decimal)</Stamp>
                  <TextField
                    value={taxRate}
                    onChange={setTaxRate}
                    type="number"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Stamp className="text-[9px] block mb-1.5">Other ($)</Stamp>
                  <TextField
                    value={other}
                    onChange={setOther}
                    type="number"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Stamp className="text-[10px]">Subtotal</Stamp>
                  <Mono className="text-[14px] font-bold text-ink">
                    {fc(subtotal)}
                  </Mono>
                </div>
                <div className="flex justify-between">
                  <Stamp className="text-[10px]">Tax</Stamp>
                  <Mono className="text-[12px] text-label">
                    {fc(subtotal * (parseFloat(taxRate) || 0))}
                  </Mono>
                </div>
                <div className="flex justify-between">
                  <Stamp className="text-[10px]">Other</Stamp>
                  <Mono className="text-[12px] text-label">
                    {fc(parseFloat(other) || 0)}
                  </Mono>
                </div>
                <div className="flex justify-between pt-2 border-t border-[rgba(74,85,104,0.08)]">
                  <Stamp>Total</Stamp>
                  <Mono className="text-[18px] font-bold text-accent">
                    {fc(total)}
                  </Mono>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={finalize}
              disabled={generating || items.length === 0 || !propertyId}
              iconLeft={
                generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )
              }
            >
              {generating ? "Generating…" : "Finalize & Download"}
            </Button>
          </div>
        </div>

        {/* Right sidebar: verification queue + chat */}
        <div className="flex flex-col gap-5">
          {/* Review queue */}
          <div className="rounded-2xl bg-chassis p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <Stamp>Review Queue</Stamp>
              <LED
                color={activeIssues.length > 0 ? "amber" : "green"}
                size={8}
                pulse={activeIssues.length > 0}
              />
            </div>
            {issues.length === 0 ? (
              <Stamp className="text-[10px] text-label/70 block">
                Upload receipts to start verification
              </Stamp>
            ) : activeIssues.length === 0 ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
                <Stamp className="text-[#15803d]">All verified</Stamp>
              </div>
            ) : (
              <div className="space-y-2">
                {issues.map((iss, i) => {
                  const resolved = resolvedIssues.has(i);
                  return (
                    <div
                      key={i}
                      className={
                        "rounded-xl p-3 shadow-recessed-sm " +
                        (resolved ? "opacity-50" : "")
                      }
                    >
                      <div className="flex gap-2">
                        <LED
                          color={resolved ? "green" : "amber"}
                          size={7}
                          pulse={!resolved}
                        />
                        <div className="flex-1 text-[11px] text-ink leading-relaxed">
                          {iss.question}
                        </div>
                      </div>
                      {!resolved && (
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => {
                              const next = new Set(resolvedIssues);
                              next.add(i);
                              setResolvedIssues(next);
                            }}
                            className="press rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-label shadow-recessed-sm hover:text-ink"
                          >
                            Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="rounded-2xl bg-chassis p-5 shadow-card flex flex-col min-h-[300px]">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-3.5 w-3.5 text-accent" />
              <Stamp>Ask Claude</Stamp>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 mb-3">
              {chatHistory.length === 0 ? (
                <Stamp className="text-[10px] text-label/70 block">
                  Ask about any line item — "is the Home Depot one duplicated?",
                  "what's missing?", etc.
                </Stamp>
              ) : (
                chatHistory.map((m, i) => (
                  <div
                    key={i}
                    className={
                      "rounded-lg px-3 py-2 text-[11px] leading-relaxed " +
                      (m.role === "user"
                        ? "bg-chassis shadow-recessed-sm ml-4 text-ink"
                        : "bg-chassis shadow-card mr-4 text-ink")
                    }
                  >
                    {m.role === "assistant" && (
                      <Stamp className="text-[8px] block mb-1 text-accent">
                        Claude
                      </Stamp>
                    )}
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="rounded-lg px-3 py-2 bg-chassis shadow-card mr-4 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-accent" />
                  <Stamp className="text-[9px]">Thinking…</Stamp>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                placeholder="Ask…"
                className="flex-1 rounded-md bg-chassis px-3 py-2 text-[11px] font-mono text-ink shadow-recessed-sm border-none outline-none focus-visible:shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff,0_0_0_2px_var(--accent)]"
              />
              <button
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="press rounded-md bg-chassis px-3 shadow-card hover:shadow-floating disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5 text-accent" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
