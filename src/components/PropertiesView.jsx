import React, { useState } from "react";
import { T } from "../data/jobs";
import { fc, pct, Mono, KpiCard } from "../utils/format";
import { useJobs } from "../context/JobsContext";
import { syncProperties } from "../utils/appfolio";

const fieldLabel = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T.text2,
  marginBottom: 6,
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
  width: 100,
  textAlign: "right",
};

const wideInput = {
  ...editInput,
  width: "100%",
  textAlign: "left",
  fontFamily: "'DM Sans', sans-serif",
};

export default function PropertiesView() {
  const { managed, updateProperty, syncAppfolio } = useJobs();
  const [selectedId, setSelectedId] = useState(managed[0]?.id);
  const prop = managed.find((p) => p.id === selectedId) || managed[0];
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
        setSyncSuccess(`Synced ${result.properties.length} properties from Appfolio`);
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: T.text3, fontSize: 14 }}>
        No managed properties yet — add one from the sidebar.
      </div>
    );
  }

  const occPct = prop.totalUnits > 0 ? pct(prop.occupiedUnits, prop.totalUnits) : 0;
  const leasePct = prop.totalUnits > 0 ? pct(prop.leasedUnits, prop.totalUnits) : 0;
  const totalDelinquent = prop.delinquent30 + prop.delinquent60;
  const totalDelinquentAmt = prop.delinquentAmount30 + prop.delinquentAmount60;
  const collectionRate = prop.monthlyIncome > 0 ? pct(prop.collectedIncome, prop.monthlyIncome) : 0;

  const set = (field, value) => updateProperty(prop.id, { [field]: value });

  return (
    <div>
      {/* Property selector */}
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
        {managed.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            style={{
              background: selectedId === p.id ? T.bg4 : "transparent",
              border: selectedId === p.id ? `1px solid ${T.border}` : "1px solid transparent",
              color: selectedId === p.id ? T.text0 : T.text2,
              fontSize: 12,
              fontWeight: 600,
              padding: "7px 18px",
              borderRadius: 7,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {p.shortName}
          </button>
        ))}
      </div>

      {/* Property header + sync */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: T.text0, letterSpacing: "-0.01em" }}>{prop.name}</div>
          <div style={{ fontSize: 12, color: T.text2, marginTop: 3 }}>
            {prop.address} &middot; {prop.type} &middot; {prop.totalUnits} units
            {prop.lastSynced && (
              <span style={{ marginLeft: 12, color: T.text3 }}>
                Last synced: {new Date(prop.lastSynced).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            background: T.blueDim,
            border: `1px solid ${T.blue}44`,
            borderRadius: 7,
            color: T.blue,
            fontSize: 11,
            fontWeight: 600,
            padding: "7px 16px",
            cursor: syncing ? "wait" : "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: syncing ? 0.6 : 1,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={syncing ? { animation: "spin 1s linear infinite" } : {}}>
            <path d="M4 12a8 8 0 0114.93-4M20 12a8 8 0 01-14.93 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 4v4h-4M4 20v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {syncing ? "Syncing..." : "Sync from Appfolio"}
        </button>
      </div>
      {syncing && <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>}
      {syncError && (
        <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: T.red }}>
          {syncError}
        </div>
      )}
      {syncSuccess && (
        <div style={{ background: T.greenDim, border: `1px solid ${T.green}44`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: T.green }}>
          {syncSuccess}
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <KpiCard
          label="Occupancy"
          value={`${occPct}%`}
          sub={`${prop.occupiedUnits} of ${prop.totalUnits} units`}
          accent={occPct >= 90 ? T.green : occPct >= 75 ? T.amber : T.red}
        />
        <KpiCard
          label="Lease Rate"
          value={`${leasePct}%`}
          sub={`${prop.leasedUnits} units under lease`}
          accent={T.blue}
        />
        <KpiCard
          label="Delinquent"
          value={totalDelinquent > 0 ? `${totalDelinquent} units` : "0"}
          sub={totalDelinquentAmt > 0 ? fc(totalDelinquentAmt) + " outstanding" : "No delinquencies"}
          accent={totalDelinquent > 0 ? T.red : T.green}
        />
        <KpiCard
          label="Monthly Income"
          value={prop.monthlyIncome > 0 ? fc(prop.monthlyIncome) : "$0"}
          sub={prop.monthlyIncome > 0 ? `${collectionRate}% collected` : "Not yet entered"}
          accent={T.gold}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Occupancy & Leasing */}
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: T.text2, marginBottom: 20 }}>
            Occupancy & Leasing
          </div>

          {/* Occupancy bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: T.text2 }}>Occupancy</span>
              <Mono style={{ fontSize: 11, color: T.text1 }}>{prop.occupiedUnits} / {prop.totalUnits}</Mono>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: T.bg4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${occPct}%`, borderRadius: 3, background: occPct >= 90 ? T.green : occPct >= 75 ? T.amber : T.red, transition: "width 0.5s" }} />
            </div>
          </div>

          {/* Lease bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: T.text2 }}>Leased</span>
              <Mono style={{ fontSize: 11, color: T.text1 }}>{prop.leasedUnits} / {prop.totalUnits}</Mono>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: T.bg4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${leasePct}%`, borderRadius: 3, background: T.blue, transition: "width 0.5s" }} />
            </div>
          </div>

          {/* Editable fields */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 18 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.text3, marginBottom: 14 }}>
              Update Values
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div style={fieldLabel}>Total Units</div>
                <input
                  type="number"
                  value={prop.totalUnits}
                  onChange={(e) => set("totalUnits", e.target.value)}
                  style={editInput}
                />
              </div>
              <div>
                <div style={fieldLabel}>Occupied</div>
                <input
                  type="number"
                  value={prop.occupiedUnits}
                  onChange={(e) => set("occupiedUnits", e.target.value)}
                  style={editInput}
                />
              </div>
              <div>
                <div style={fieldLabel}>Leased</div>
                <input
                  type="number"
                  value={prop.leasedUnits}
                  onChange={(e) => set("leasedUnits", e.target.value)}
                  style={editInput}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delinquency */}
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: T.text2, marginBottom: 20 }}>
            Delinquency
          </div>

          {/* 30+ days */}
          <div style={{ background: T.bg3, borderRadius: 8, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.amber }}>30+ Days Late</span>
              <Mono style={{ fontSize: 14, fontWeight: 700, color: prop.delinquent30 > 0 ? T.amber : T.text3 }}>
                {prop.delinquent30} units
              </Mono>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={fieldLabel}>Units</div>
                <input
                  type="number"
                  value={prop.delinquent30}
                  onChange={(e) => set("delinquent30", e.target.value)}
                  style={editInput}
                />
              </div>
              <div>
                <div style={fieldLabel}>Amount</div>
                <input
                  type="number"
                  value={prop.delinquentAmount30}
                  onChange={(e) => set("delinquentAmount30", e.target.value)}
                  style={editInput}
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* 60+ days */}
          <div style={{ background: T.bg3, borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.red }}>60+ Days Late</span>
              <Mono style={{ fontSize: 14, fontWeight: 700, color: prop.delinquent60 > 0 ? T.red : T.text3 }}>
                {prop.delinquent60} units
              </Mono>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={fieldLabel}>Units</div>
                <input
                  type="number"
                  value={prop.delinquent60}
                  onChange={(e) => set("delinquent60", e.target.value)}
                  style={editInput}
                />
              </div>
              <div>
                <div style={fieldLabel}>Amount</div>
                <input
                  type="number"
                  value={prop.delinquentAmount60}
                  onChange={(e) => set("delinquentAmount60", e.target.value)}
                  style={editInput}
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {totalDelinquentAmt > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.text2 }}>Total Outstanding</span>
              <Mono style={{ fontSize: 13, fontWeight: 700, color: T.red }}>{fc(totalDelinquentAmt)}</Mono>
            </div>
          )}
        </div>
      </div>

      {/* Income */}
      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "22px 24px", marginTop: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: T.text2, marginBottom: 20 }}>
          Income
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          <div>
            <div style={fieldLabel}>Monthly Expected</div>
            <input
              type="number"
              value={prop.monthlyIncome}
              onChange={(e) => set("monthlyIncome", e.target.value)}
              style={{ ...editInput, width: "100%" }}
              step="0.01"
            />
            {prop.monthlyIncome > 0 && (
              <div style={{ marginTop: 8 }}>
                <Mono style={{ fontSize: 18, fontWeight: 700, color: T.gold }}>{fc(prop.monthlyIncome)}</Mono>
              </div>
            )}
          </div>
          <div>
            <div style={fieldLabel}>Collected</div>
            <input
              type="number"
              value={prop.collectedIncome}
              onChange={(e) => set("collectedIncome", e.target.value)}
              style={{ ...editInput, width: "100%" }}
              step="0.01"
            />
            {prop.collectedIncome > 0 && (
              <div style={{ marginTop: 8 }}>
                <Mono style={{ fontSize: 18, fontWeight: 700, color: T.green }}>{fc(prop.collectedIncome)}</Mono>
              </div>
            )}
          </div>
          <div>
            <div style={fieldLabel}>Collection Rate</div>
            <div style={{ marginTop: 6 }}>
              <Mono style={{ fontSize: 24, fontWeight: 700, color: collectionRate >= 95 ? T.green : collectionRate >= 85 ? T.amber : T.red }}>
                {prop.monthlyIncome > 0 ? `${collectionRate}%` : "\u2014"}
              </Mono>
            </div>
            {prop.monthlyIncome > 0 && prop.collectedIncome < prop.monthlyIncome && (
              <div style={{ fontSize: 11, color: T.text2, marginTop: 4 }}>
                {fc(prop.monthlyIncome - prop.collectedIncome)} outstanding
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
