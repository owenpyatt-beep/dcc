import React, { useState, useEffect, useMemo } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import { supabase } from "../utils/supabase";
import { useJobs } from "../context/JobsContext";
import { fc, Mono, Badge } from "../utils/format";
import { Stamp } from "./ui/Typography";
import { LED } from "./ui/LED";
import { Button } from "./ui/Button";
import { isInternalGC } from "../utils/vendors";

function TextInput({ value, onChange, placeholder, icon: Icon }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-label pointer-events-none" />
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          "w-full rounded-md bg-chassis py-2 text-[12px] font-mono text-ink shadow-recessed-sm border-none outline-none transition-shadow focus-visible:shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff,0_0_0_2px_var(--accent)] " +
          (Icon ? "pl-8 pr-3" : "px-3")
        }
      />
    </div>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md bg-chassis px-3 py-2 text-[12px] font-mono text-ink shadow-recessed-sm border-none outline-none appearance-none cursor-pointer focus-visible:shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff,0_0_0_2px_var(--accent)]"
    >
      {children}
    </select>
  );
}

export default function InvoiceDatabaseView() {
  const { properties } = useJobs();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawsById, setDrawsById] = useState({});

  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [sortBy, setSortBy] = useState("invoice_date");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase.from("invoices").select("*").order("invoice_date", { ascending: false }),
      supabase.from("draws").select("id, num, property_id"),
    ]).then(([invRes, drawRes]) => {
      if (cancelled) return;
      if (!invRes.error) setRows(invRes.data || []);
      if (!drawRes.error) {
        const lookup = {};
        for (const d of drawRes.data || []) lookup[d.id] = d;
        setDrawsById(lookup);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const propsById = useMemo(() => {
    const m = {};
    for (const p of properties) m[p.id] = p;
    return m;
  }, [properties]);

  const trades = useMemo(() => {
    const s = new Set();
    for (const r of rows) if (r.trade_category) s.add(r.trade_category);
    return [...s].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const vq = vendorFilter.trim().toLowerCase();
    const min = amountMin ? parseFloat(amountMin) : null;
    const max = amountMax ? parseFloat(amountMax) : null;
    return rows.filter((r) => {
      if (propertyFilter && r.property_id !== propertyFilter) return false;
      if (tradeFilter && r.trade_category !== tradeFilter) return false;
      if (vq && !(r.vendor || "").toLowerCase().includes(vq)) return false;
      if (dateFrom && (r.invoice_date || "") < dateFrom) return false;
      if (dateTo && (r.invoice_date || "") > dateTo) return false;
      const amt = parseFloat(r.amount_due) || 0;
      if (min !== null && amt < min) return false;
      if (max !== null && amt > max) return false;
      if (q) {
        const hay = [
          r.vendor,
          r.invoice_number,
          r.trade_category,
          r.job_name,
          propsById[r.property_id]?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    rows,
    search,
    propertyFilter,
    tradeFilter,
    vendorFilter,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    propsById,
  ]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av, bv;
      if (sortBy === "amount_due") {
        av = parseFloat(a.amount_due) || 0;
        bv = parseFloat(b.amount_due) || 0;
      } else {
        av = (a[sortBy] || "").toString();
        bv = (b[sortBy] || "").toString();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const totalAmount = sorted.reduce(
    (s, r) => s + (parseFloat(r.amount_due) || 0),
    0
  );

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const sortArrow = (field) =>
    sortBy === field ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const clearFilters = () => {
    setSearch("");
    setPropertyFilter("");
    setTradeFilter("");
    setVendorFilter("");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
  };

  const exportCsv = () => {
    const rows = sorted.map((r) => [
      `"${(r.vendor || "").replace(/"/g, '""')}"`,
      `"${(r.invoice_number || "").replace(/"/g, '""')}"`,
      (parseFloat(r.amount_due) || 0).toFixed(2),
      `"${(r.trade_category || "").replace(/"/g, '""')}"`,
      `"${r.invoice_date || ""}"`,
      `"${(propsById[r.property_id]?.name || "").replace(/"/g, '""')}"`,
      drawsById[r.draw_id]?.num || "",
    ]);
    const csv =
      "Vendor,Invoice #,Amount,Category,Date,Property,Draw #\n" +
      rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `InvoiceDatabase_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <div className="text-2xl font-bold text-ink emboss">Invoice Database</div>
          <Stamp className="text-[10px] mt-1 block">
            {loading
              ? "Loading…"
              : `${sorted.length.toLocaleString()} of ${rows.length.toLocaleString()} · ${fc(totalAmount)}`}
          </Stamp>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            Clear
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportCsv}
            iconLeft={<Download className="h-3 w-3" />}
            disabled={sorted.length === 0}
          >
            CSV
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-chassis p-5 shadow-card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div className="md:col-span-2">
            <Stamp className="text-[9px] block mb-1.5">Search</Stamp>
            <TextInput
              value={search}
              onChange={setSearch}
              placeholder="Vendor, invoice #, property, trade…"
              icon={Search}
            />
          </div>
          <div>
            <Stamp className="text-[9px] block mb-1.5">Property</Stamp>
            <Select value={propertyFilter} onChange={setPropertyFilter}>
              <option value="">All</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.shortName || p.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Stamp className="text-[9px] block mb-1.5">Trade</Stamp>
            <Select value={tradeFilter} onChange={setTradeFilter}>
              <option value="">All</option>
              {trades.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <Stamp className="text-[9px] block mb-1.5">Vendor</Stamp>
            <TextInput
              value={vendorFilter}
              onChange={setVendorFilter}
              placeholder="Filter…"
            />
          </div>
          <div>
            <Stamp className="text-[9px] block mb-1.5">Date From</Stamp>
            <TextInput
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div>
            <Stamp className="text-[9px] block mb-1.5">Date To</Stamp>
            <TextInput
              value={dateTo}
              onChange={setDateTo}
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div>
            <Stamp className="text-[9px] block mb-1.5">Min $</Stamp>
            <TextInput
              value={amountMin}
              onChange={setAmountMin}
              placeholder="0"
            />
          </div>
          <div>
            <Stamp className="text-[9px] block mb-1.5">Max $</Stamp>
            <TextInput
              value={amountMax}
              onChange={setAmountMax}
              placeholder="∞"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-chassis shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 text-accent animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-chassis shadow-recessed-sm">
              <LED color="amber" size={8} pulse />
              <Stamp>No invoices match</Stamp>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {[
                    { key: "invoice_date", label: "Date" },
                    { key: "vendor", label: "Vendor" },
                    { key: "invoice_number", label: "Invoice #" },
                    { key: "amount_due", label: "Amount" },
                    { key: "trade_category", label: "Category" },
                    { key: "property_id", label: "Property" },
                    { key: "draw_id", label: "Draw" },
                  ].map((c) => (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c.key)}
                      className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-label cursor-pointer hover:text-ink select-none"
                    >
                      {c.label}
                      {sortArrow(c.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 500).map((r) => {
                  const prop = propsById[r.property_id];
                  const draw = drawsById[r.draw_id];
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-[rgba(74,85,104,0.05)] hover:bg-white/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-[11px] text-label">
                        {r.invoice_date || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-ink truncate max-w-[220px]">
                            {r.vendor || "—"}
                          </span>
                          {isInternalGC(r.vendor) && (
                            <span className="shrink-0 inline-flex items-center rounded-md px-1.5 py-[1px] bg-chassis shadow-recessed-sm font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-label">
                              Internal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-label truncate max-w-[140px]">
                        {r.invoice_number || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Mono className="text-[12px] font-bold text-ink">
                          {fc(parseFloat(r.amount_due) || 0)}
                        </Mono>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-label">
                        {r.trade_category || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-ink">
                        {prop?.shortName || prop?.name || "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-label">
                        {draw ? `#${draw.num}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sorted.length > 500 && (
              <div className="px-4 py-3 border-t border-[rgba(74,85,104,0.08)] text-center">
                <Stamp className="text-[9px] text-label/70">
                  Showing first 500 of {sorted.length.toLocaleString()} — refine
                  filters to narrow
                </Stamp>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
