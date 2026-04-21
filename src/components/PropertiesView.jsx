import React, { useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fc, pct, Mono, KpiCard, ProgressBar } from "../utils/format";
import { useJobs } from "../context/JobsContext";
import { syncProperties } from "../utils/appfolio";
import { Button } from "./ui/Button";
import { Stamp } from "./ui/Typography";
import { LED } from "./ui/LED";
import { Label } from "./ui/Input";

function NumInput({ value, onChange, step, align = "right" }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      step={step}
      className={
        "w-full rounded-md bg-chassis px-3 py-2 text-sm font-mono font-semibold text-ink shadow-recessed-sm border-none outline-none transition-shadow focus-visible:shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff,0_0_0_2px_var(--accent)] " +
        (align === "right" ? "text-right" : "")
      }
    />
  );
}

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

function Panel({ title, children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl bg-chassis p-6 shadow-card relative overflow-hidden " +
        className
      }
    >
      <div className="flex items-center justify-between mb-5">
        <Stamp>{title}</Stamp>
      </div>
      {children}
    </div>
  );
}

export default function PropertiesView({ selectedId: initialId }) {
  const { managed, updateProperty, syncAppfolio } = useJobs();
  const [selectedId, setSelectedId] = useState(initialId || managed[0]?.id);
  const prop = managed.find((p) => p.id === selectedId) || managed[0];

  React.useEffect(() => {
    if (initialId) setSelectedId(initialId);
  }, [initialId]);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const result = await syncProperties();
      if (result.ok && result.properties) {
        syncAppfolio(result.properties);
        setSyncSuccess(
          `Synced ${result.properties.length} properties from Appfolio`
        );
        setTimeout(() => setSyncSuccess(null), 4000);
      } else {
        setSyncError(result.error || "Sync returned no data");
      }
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (!prop) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-chassis shadow-recessed-sm">
            <LED color="amber" size={8} pulse />
            <Stamp>No managed properties yet</Stamp>
          </div>
          <div className="mt-3 text-sm text-label">
            Add one from the sidebar.
          </div>
        </div>
      </div>
    );
  }

  const occPct =
    prop.totalUnits > 0 ? pct(prop.occupiedUnits, prop.totalUnits) : 0;
  const leasePct =
    prop.totalUnits > 0 ? pct(prop.leasedUnits, prop.totalUnits) : 0;
  const totalLate = prop.delinquent30 + prop.delinquent60;
  const totalLateAmt = prop.delinquentAmount30 + prop.delinquentAmount60;
  const collectionRate =
    prop.monthlyIncome > 0 ? pct(prop.collectedIncome, prop.monthlyIncome) : 0;

  const set = (field, value) => updateProperty(prop.id, { [field]: value });

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Property selector tabs */}
      <div className="inline-flex items-center gap-1 mb-6 p-1 rounded-xl bg-chassis shadow-recessed">
        {managed.map((p) => (
          <PillTab
            key={p.id}
            active={selectedId === p.id}
            onClick={() => setSelectedId(p.id)}
          >
            {p.shortName}
          </PillTab>
        ))}
      </div>

      {/* Header + sync action */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <div className="text-2xl md:text-[26px] font-bold text-ink emboss tracking-tight">
            {prop.name}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-mono text-label">
            <span>{prop.address}</span>
            <span className="text-label/40">·</span>
            <span>{prop.type}</span>
            <span className="text-label/40">·</span>
            <span>{prop.totalUnits} units</span>
            {prop.lastSynced && (
              <>
                <span className="text-label/40">·</span>
                <span className="text-label/70">
                  synced {new Date(prop.lastSynced).toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleSync}
          disabled={syncing}
          iconLeft={
            <RefreshCw
              className={"h-3.5 w-3.5 " + (syncing ? "animate-spin" : "")}
              strokeWidth={2}
            />
          }
        >
          {syncing ? "Syncing..." : "Sync Appfolio"}
        </Button>
      </div>

      {syncError && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-chassis shadow-recessed-sm">
          <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
          <span className="font-mono text-xs text-[#b91c1c]">{syncError}</span>
        </div>
      )}
      {syncSuccess && (
        <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-chassis shadow-recessed-sm">
          <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
          <span className="font-mono text-xs text-[#15803d]">
            {syncSuccess}
          </span>
        </div>
      )}

      <div className="grid-4 mb-6">
        <KpiCard
          label="Occupancy"
          value={`${occPct}%`}
          sub={`${prop.occupiedUnits} of ${prop.totalUnits} units`}
          accent={
            occPct >= 90 ? "#22c55e" : occPct >= 75 ? "#f59e0b" : "#ef4444"
          }
        />
        <KpiCard
          label="Lease Rate"
          value={`${leasePct}%`}
          sub={`${prop.leasedUnits} units under lease`}
          accent="#3b82f6"
        />
        <KpiCard
          label="Late Payments"
          value={totalLate > 0 ? `${totalLate} units` : "0"}
          sub={
            totalLateAmt > 0 ? fc(totalLateAmt) + " outstanding" : "All current"
          }
          accent={totalLate > 0 ? "#ef4444" : "#22c55e"}
        />
        <KpiCard
          label="Monthly Income"
          value={prop.monthlyIncome > 0 ? fc(prop.monthlyIncome) : "$0"}
          sub={
            prop.monthlyIncome > 0
              ? `${collectionRate}% collected`
              : "Not yet entered"
          }
          accent="#ff4757"
        />
      </div>

      <div className="grid-2 mb-6">
        <Panel title="Occupancy & Leasing">
          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <Stamp className="text-[9px]">Occupancy</Stamp>
              <Mono className="text-[11px] text-label">
                {prop.occupiedUnits} / {prop.totalUnits}
              </Mono>
            </div>
            <ProgressBar
              value={prop.occupiedUnits}
              max={prop.totalUnits || 1}
              color={
                occPct >= 90 ? "#22c55e" : occPct >= 75 ? "#f59e0b" : "#ef4444"
              }
              height={6}
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <Stamp className="text-[9px]">Leased</Stamp>
              <Mono className="text-[11px] text-label">
                {prop.leasedUnits} / {prop.totalUnits}
              </Mono>
            </div>
            <ProgressBar
              value={prop.leasedUnits}
              max={prop.totalUnits || 1}
              color="#3b82f6"
              height={6}
            />
          </div>

          <div className="pt-5 border-t border-[rgba(74,85,104,0.1)]">
            <Stamp className="text-[9px] block mb-3">Update Values</Stamp>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Total</Label>
                <NumInput
                  value={prop.totalUnits}
                  onChange={(v) => set("totalUnits", v)}
                />
              </div>
              <div>
                <Label>Occupied</Label>
                <NumInput
                  value={prop.occupiedUnits}
                  onChange={(v) => set("occupiedUnits", v)}
                />
              </div>
              <div>
                <Label>Leased</Label>
                <NumInput
                  value={prop.leasedUnits}
                  onChange={(v) => set("leasedUnits", v)}
                />
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Late Payments">
          <div className="mb-3 rounded-xl bg-chassis p-4 shadow-recessed-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                <LED color="amber" size={8} pulse={prop.delinquent30 > 0} />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-label">
                  30+ Days Late
                </span>
              </span>
              <Mono
                className={
                  "text-[15px] font-bold " +
                  (prop.delinquent30 > 0 ? "text-[#b45309]" : "text-label")
                }
              >
                {prop.delinquent30} units
              </Mono>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Units</Label>
                <NumInput
                  value={prop.delinquent30}
                  onChange={(v) => set("delinquent30", v)}
                />
              </div>
              <div>
                <Label>Amount ($)</Label>
                <NumInput
                  value={prop.delinquentAmount30}
                  onChange={(v) => set("delinquentAmount30", v)}
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-xl bg-chassis p-4 shadow-recessed-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                <LED color="red" size={8} pulse={prop.delinquent60 > 0} />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-label">
                  60+ Days Late
                </span>
              </span>
              <Mono
                className={
                  "text-[15px] font-bold " +
                  (prop.delinquent60 > 0 ? "text-[#b91c1c]" : "text-label")
                }
              >
                {prop.delinquent60} units
              </Mono>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Units</Label>
                <NumInput
                  value={prop.delinquent60}
                  onChange={(v) => set("delinquent60", v)}
                />
              </div>
              <div>
                <Label>Amount ($)</Label>
                <NumInput
                  value={prop.delinquentAmount60}
                  onChange={(v) => set("delinquentAmount60", v)}
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {totalLateAmt > 0 && (
            <div className="flex justify-between items-center pt-3 border-t border-[rgba(74,85,104,0.1)]">
              <Stamp>Total Outstanding</Stamp>
              <Mono className="text-[15px] font-bold text-[#b91c1c]">
                {fc(totalLateAmt)}
              </Mono>
            </div>
          )}
        </Panel>
      </div>

      {(prop.vacantRented > 0 ||
        prop.vacantUnrented > 0 ||
        prop.noticeRented > 0 ||
        prop.noticeUnrented > 0) && (
        <Panel title="Vacancy Pipeline" className="mb-6">
          <div className="grid-4">
            {[
              {
                label: "Vacant - Rented",
                value: prop.vacantRented || 0,
                color: "green",
                sub: "Lease signed, pending move-in",
              },
              {
                label: "Vacant - Unrented",
                value: prop.vacantUnrented || 0,
                color: "red",
                sub: "Empty, no lease",
              },
              {
                label: "Notice - Rented",
                value: prop.noticeRented || 0,
                color: "blue",
                sub: "Leaving, replacement found",
              },
              {
                label: "Notice - Unrented",
                value: prop.noticeUnrented || 0,
                color: "amber",
                sub: "Leaving, no replacement",
              },
            ].map((v) => (
              <div
                key={v.label}
                className="rounded-xl bg-chassis p-4 shadow-recessed-sm relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-label">
                    {v.label}
                  </span>
                  {v.value > 0 && <LED color={v.color} size={7} pulse />}
                </div>
                <Mono
                  className={
                    "text-3xl font-bold " +
                    (v.value > 0 ? "text-ink emboss" : "text-label/60")
                  }
                >
                  {v.value}
                </Mono>
                <div className="mt-1 text-[10px] font-mono text-label">
                  {v.sub}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid-2">
        <Panel title="This Month">
          <div className="grid grid-cols-2 gap-5">
            {[
              {
                label: "Rental Income",
                value:
                  prop.monthRentalIncome || prop.collectedIncome || 0,
                color: "text-accent",
              },
              {
                label: "Total Income",
                value: prop.monthTotalIncome || prop.monthlyIncome || 0,
                color: "text-ink",
              },
              {
                label: "Expenses",
                value: prop.monthExpenses || 0,
                color: "text-[#b91c1c]",
              },
              {
                label: "Net Income",
                value: prop.monthNOI || 0,
                color: "text-[#15803d]",
              },
            ].map((s) => (
              <div key={s.label}>
                <Stamp className="text-[9px]">{s.label}</Stamp>
                <Mono
                  className={"mt-1.5 block text-xl font-bold " + s.color}
                >
                  {fc(s.value)}
                </Mono>
              </div>
            ))}
          </div>
          {prop.monthlyIncome > 0 && prop.collectedIncome > 0 && (
            <div className="mt-5 pt-4 border-t border-[rgba(74,85,104,0.1)] flex items-center justify-between">
              <Stamp>Collection Rate</Stamp>
              <div className="flex items-center gap-2">
                <LED
                  color={
                    collectionRate >= 95
                      ? "green"
                      : collectionRate >= 85
                      ? "amber"
                      : "red"
                  }
                  size={8}
                  pulse
                />
                <Mono
                  className={
                    "text-2xl font-bold " +
                    (collectionRate >= 95
                      ? "text-[#15803d]"
                      : collectionRate >= 85
                      ? "text-[#b45309]"
                      : "text-[#b91c1c]")
                  }
                >
                  {collectionRate}%
                </Mono>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Year to Date">
          <div className="grid grid-cols-2 gap-5">
            {[
              {
                label: "Rental Income",
                value: prop.ytdRentalIncome || 0,
                color: "text-accent",
              },
              {
                label: "Total Income",
                value: prop.ytdTotalIncome || 0,
                color: "text-ink",
              },
              {
                label: "Expenses",
                value: prop.ytdExpenses || 0,
                color: "text-[#b91c1c]",
              },
              {
                label: "Net Income",
                value: prop.ytdNOI || 0,
                color: "text-[#15803d]",
              },
            ].map((s) => (
              <div key={s.label}>
                <Stamp className="text-[9px]">{s.label}</Stamp>
                <Mono
                  className={"mt-1.5 block text-xl font-bold " + s.color}
                >
                  {fc(s.value)}
                </Mono>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
