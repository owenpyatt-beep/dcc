import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { fc, pct, Mono, KpiCard, ProgressBar } from "../utils/format";
import { DRAW_STATUS } from "../data/jobs";
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

function Panel({ title, children, action, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl bg-chassis p-6 shadow-card relative overflow-hidden " +
        className
      }
    >
      <div className="flex items-center justify-between mb-5">
        <Stamp>{title}</Stamp>
        {action}
      </div>
      {children}
    </div>
  );
}

function BuildDetail({ prop, onGoToDraws, updateProperty }) {
  const draws = prop.draws || [];
  const currentDraw = draws[draws.length - 1];
  const statusLabel = currentDraw
    ? DRAW_STATUS[currentDraw.status]?.label || currentDraw.status
    : null;
  const ledColor = currentDraw?.status === "funded" ? "green" : "purple";

  const set = (field, value) => updateProperty(prop.id, { [field]: value });

  const fundedTotal = draws
    .filter((d) => d.status === "funded")
    .reduce((s, d) => s + (d.amount || 0), 0);
  const submittedTotal = draws
    .filter((d) => d.status === "submitted")
    .reduce((s, d) => s + (d.amount || 0), 0);

  const completion = prop.completion || 0;
  const drawnPct =
    prop.totalProjectCost > 0
      ? Math.round((prop.drawnToDate / prop.totalProjectCost) * 100)
      : 0;
  const equityPct =
    prop.equityRequired > 0
      ? Math.round((prop.equityIn / prop.equityRequired) * 100)
      : 0;

  return (
    <>
      <div className="grid-4 mb-6">
        <KpiCard
          label="Project Cost"
          value={fc(prop.totalProjectCost || 0)}
          sub={`Loan ${fc(prop.loanAmount || 0)}`}
          accent="#ff4757"
        />
        <KpiCard
          label="Drawn To Date"
          value={fc(prop.drawnToDate || 0)}
          sub={`${drawnPct}% of project`}
          accent="#3b82f6"
        />
        <KpiCard
          label="Completion"
          value={`${completion}%`}
          sub={currentDraw ? `${statusLabel} · Draw #${currentDraw.num}` : "No draws"}
          accent={completion >= 90 ? "#22c55e" : completion >= 50 ? "#f59e0b" : "#ff4757"}
        />
        <KpiCard
          label="Equity In"
          value={fc(prop.equityIn || 0)}
          sub={
            prop.equityRequired > 0
              ? `${equityPct}% of ${fc(prop.equityRequired)} required`
              : "Not set"
          }
          accent="#8b5cf6"
        />
      </div>

      <div className="grid-2 mb-6">
        <Panel
          title="Build Progress"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onGoToDraws(prop.id)}
              iconRight={<ArrowRight className="h-3 w-3" />}
            >
              Draws
            </Button>
          }
        >
          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <Stamp className="text-[9px]">Drawn vs Project</Stamp>
              <Mono className="text-[11px] text-label">
                {fc(prop.drawnToDate || 0)} / {fc(prop.totalProjectCost || 0)}
              </Mono>
            </div>
            <ProgressBar
              value={prop.drawnToDate || 0}
              max={prop.totalProjectCost || 1}
              color="#3b82f6"
              height={6}
            />
          </div>

          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <Stamp className="text-[9px]">Completion</Stamp>
              <Mono className="text-[11px] text-label">{completion}%</Mono>
            </div>
            <ProgressBar
              value={completion}
              max={100}
              color={completion >= 90 ? "#22c55e" : "#ff4757"}
              height={6}
            />
          </div>

          <div className="pt-5 border-t border-[rgba(74,85,104,0.1)]">
            <Stamp className="text-[9px] block mb-3">Update Values</Stamp>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Drawn ($)</Label>
                <NumInput
                  value={prop.drawnToDate || 0}
                  onChange={(v) => set("drawnToDate", v)}
                  step="0.01"
                />
              </div>
              <div>
                <Label>Equity In ($)</Label>
                <NumInput
                  value={prop.equityIn || 0}
                  onChange={(v) => set("equityIn", v)}
                  step="0.01"
                />
              </div>
              <div>
                <Label>% Complete</Label>
                <NumInput
                  value={completion}
                  onChange={(v) => set("completion", v)}
                  step="1"
                />
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Draws Summary">
          <div className="mb-4 rounded-xl bg-chassis p-4 shadow-recessed-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2">
                <LED color={ledColor} size={8} pulse={!!currentDraw} />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-label">
                  Current Draw
                </span>
              </span>
              <Mono className="text-[13px] font-bold text-ink">
                {currentDraw
                  ? `#${currentDraw.num} · ${fc(currentDraw.amount || 0)}`
                  : "—"}
              </Mono>
            </div>
            {currentDraw && (
              <Mono className="block text-[10px] text-label">
                {statusLabel}
                {currentDraw.submitted && ` · submitted ${currentDraw.submitted}`}
                {currentDraw.funded && ` · funded ${currentDraw.funded}`}
              </Mono>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-chassis p-4 shadow-recessed-sm">
              <Stamp className="text-[9px]">Funded Total</Stamp>
              <Mono className="mt-1.5 block text-xl font-bold text-[#15803d]">
                {fc(fundedTotal)}
              </Mono>
              <div className="text-[10px] font-mono text-label mt-0.5">
                {draws.filter((d) => d.status === "funded").length} funded
              </div>
            </div>
            <div className="rounded-xl bg-chassis p-4 shadow-recessed-sm">
              <Stamp className="text-[9px]">Pending</Stamp>
              <Mono className="mt-1.5 block text-xl font-bold text-[#8b5cf6]">
                {fc(submittedTotal)}
              </Mono>
              <div className="text-[10px] font-mono text-label mt-0.5">
                {draws.filter((d) => d.status === "submitted").length} submitted
              </div>
            </div>
          </div>

          {(prop.foreman || prop.pm || prop.startDate || prop.estCompletion) && (
            <div className="mt-4 pt-4 border-t border-[rgba(74,85,104,0.1)] grid grid-cols-2 gap-3">
              {prop.pm && (
                <div>
                  <Stamp className="text-[9px]">PM</Stamp>
                  <div className="text-[12px] font-semibold text-ink mt-1">
                    {prop.pm}
                  </div>
                </div>
              )}
              {prop.foreman && (
                <div>
                  <Stamp className="text-[9px]">Foreman</Stamp>
                  <div className="text-[12px] font-semibold text-ink mt-1">
                    {prop.foreman}
                  </div>
                </div>
              )}
              {prop.startDate && (
                <div>
                  <Stamp className="text-[9px]">Start</Stamp>
                  <div className="text-[12px] font-mono text-ink mt-1">
                    {prop.startDate}
                  </div>
                </div>
              )}
              {prop.estCompletion && (
                <div>
                  <Stamp className="text-[9px]">Est. Completion</Stamp>
                  <div className="text-[12px] font-mono text-ink mt-1">
                    {prop.estCompletion}
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function ManagedDetail({ prop, updateProperty }) {
  const occPct = prop.totalUnits > 0 ? pct(prop.occupiedUnits, prop.totalUnits) : 0;
  const leasePct =
    prop.totalUnits > 0 ? pct(prop.leasedUnits, prop.totalUnits) : 0;
  const totalLate = prop.delinquent30 + prop.delinquent60;
  const totalLateAmt = prop.delinquentAmount30 + prop.delinquentAmount60;
  const collectionRate =
    prop.monthlyIncome > 0 ? pct(prop.collectedIncome, prop.monthlyIncome) : 0;

  const set = (field, value) => updateProperty(prop.id, { [field]: value });

  return (
    <>
      <div className="grid-4 mb-6">
        <KpiCard
          label="Occupancy"
          value={`${occPct}%`}
          sub={`${prop.occupiedUnits} of ${prop.totalUnits} units`}
          accent={occPct >= 90 ? "#22c55e" : occPct >= 75 ? "#f59e0b" : "#ef4444"}
        />
        <KpiCard
          label="Lease Rate"
          value={`${leasePct}%`}
          sub={`${prop.leasedUnits} under lease`}
          accent="#3b82f6"
        />
        <KpiCard
          label="Late Payments"
          value={totalLate > 0 ? `${totalLate} units` : "0"}
          sub={totalLateAmt > 0 ? fc(totalLateAmt) + " outstanding" : "All current"}
          accent={totalLate > 0 ? "#ef4444" : "#22c55e"}
        />
        <KpiCard
          label="Monthly Income"
          value={prop.monthlyIncome > 0 ? fc(prop.monthlyIncome) : "$0"}
          sub={prop.monthlyIncome > 0 ? `${collectionRate}% collected` : "Not yet entered"}
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
              color={occPct >= 90 ? "#22c55e" : occPct >= 75 ? "#f59e0b" : "#ef4444"}
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

      <div className="grid-2">
        <Panel title="This Month">
          <div className="grid grid-cols-2 gap-5">
            {[
              {
                label: "Rental Income",
                value: prop.monthRentalIncome || prop.collectedIncome || 0,
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
                <Mono className={"mt-1.5 block text-xl font-bold " + s.color}>
                  {fc(s.value)}
                </Mono>
              </div>
            ))}
          </div>
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
                <Mono className={"mt-1.5 block text-xl font-bold " + s.color}>
                  {fc(s.value)}
                </Mono>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

export default function PropertiesView({ selectedId: initialId, onGoToDraws }) {
  const { properties, updateProperty, syncAppfolio } = useJobs();
  const [selectedId, setSelectedId] = useState(initialId || properties[0]?.id);
  const prop = properties.find((p) => p.id === selectedId) || properties[0];

  useEffect(() => {
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
            <Stamp>No properties yet</Stamp>
          </div>
          <div className="mt-3 text-sm text-label">
            Add one from the sidebar.
          </div>
        </div>
      </div>
    );
  }

  const isBuild = prop.category === "build";

  const headerMeta = [
    prop.address,
    prop.type,
    isBuild
      ? `${prop.completion || 0}% complete`
      : prop.totalUnits
      ? `${prop.totalUnits} units`
      : null,
    !isBuild && prop.lastSynced
      ? `synced ${new Date(prop.lastSynced).toLocaleString()}`
      : null,
  ].filter(Boolean);

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="inline-flex items-center gap-1 mb-6 p-1 rounded-xl bg-chassis shadow-recessed overflow-x-auto max-w-full">
        {properties.map((p) => (
          <PillTab
            key={p.id}
            active={selectedId === p.id}
            onClick={() => setSelectedId(p.id)}
          >
            {p.shortName || p.name}
          </PillTab>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <div className="text-2xl md:text-[26px] font-bold text-ink emboss tracking-tight">
            {prop.name}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-mono text-label">
            {headerMeta.map((m, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-label/40">·</span>}
                <span>{m}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        {!isBuild && (
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
        )}
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
          <span className="font-mono text-xs text-[#15803d]">{syncSuccess}</span>
        </div>
      )}

      {isBuild ? (
        <BuildDetail
          prop={prop}
          onGoToDraws={onGoToDraws}
          updateProperty={updateProperty}
        />
      ) : (
        <ManagedDetail prop={prop} updateProperty={updateProperty} />
      )}
    </div>
  );
}
