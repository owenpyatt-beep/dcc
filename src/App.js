import React, { useState, useEffect } from "react";
import { T, DRAW_STATUS } from "./data/jobs";
import { Mono, pct } from "./utils/format";
import { useJobs } from "./context/JobsContext";
import PortfolioView from "./components/PortfolioView";
import PropertiesView from "./components/PropertiesView";
import DrawsView from "./components/DrawsView";
import InvoicesView from "./components/InvoicesView";
import AddJobModal from "./components/AddJobModal";

function PortfolioIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke={active ? T.gold : T.text3} strokeWidth="1.3" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke={active ? T.gold : T.text3} strokeWidth="1.3" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke={active ? T.gold : T.text3} strokeWidth="1.3" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke={active ? T.gold : T.text3} strokeWidth="1.3" />
    </svg>
  );
}

function PropertiesIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 14V6l6-4 6 4v8" stroke={active ? T.gold : T.text3} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5.5" y="9" width="5" height="5" rx="0.5" stroke={active ? T.gold : T.text3} strokeWidth="1.3" />
    </svg>
  );
}

function DrawsIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="4" rx="1.5" stroke={active ? T.gold : T.text3} strokeWidth="1.3" />
      <rect x="1" y="6" width="14" height="4" rx="1.5" stroke={active ? T.gold : T.text3} strokeWidth="1.3" />
      <rect x="1" y="11" width="14" height="4" rx="1.5" stroke={active ? T.gold : T.text3} strokeWidth="1.3" />
    </svg>
  );
}

function InvoicesIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M4 1h6l3 3v10.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-13a.5.5 0 01.5-.5z" stroke={active ? T.gold : T.text3} strokeWidth="1.3" />
      <path d="M10 1v3h3" stroke={active ? T.gold : T.text3} strokeWidth="1.3" />
      <path d="M6 8h5M6 10.5h3" stroke={active ? T.gold : T.text3} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const NAV = [
  { id: "portfolio", label: "Portfolio", Icon: PortfolioIcon },
  { id: "properties", label: "Properties", Icon: PropertiesIcon },
  { id: "draws", label: "Draws", Icon: DrawsIcon },
  { id: "invoices", label: "Invoices", Icon: InvoicesIcon },
];

const TITLES = {
  portfolio: "Portfolio Overview",
  properties: "Managed Properties",
  draws: "Draw Management",
  invoices: "Invoice Extraction",
};

export default function App() {
  const { properties, builds, managed, addProperty } = useJobs();
  const [view, setView] = useState("portfolio");
  const [loaded, setLoaded] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSelectManaged = (id) => {
    setView("properties");
  };

  const handleSelectBuild = (id) => {
    setView("draws");
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        background: T.bg0,
        minHeight: "100vh",
        color: T.text0,
        display: "flex",
        fontSize: 14,
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {showAddJob && (
        <AddJobModal
          onClose={() => setShowAddJob(false)}
          onSubmit={addProperty}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: T.bg1,
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "22px 20px 20px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: `linear-gradient(135deg, ${T.gold}, #9e7a3a)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 900,
                color: T.bg0,
                flexShrink: 0,
              }}
            >
              D
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.text0,
                  lineHeight: 1.1,
                }}
              >
                Debrecht
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: T.text3,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                Command Center
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.text3,
              padding: "4px 10px 10px",
            }}
          >
            Navigation
          </div>
          {NAV.map((n) => {
            const isActive = view === n.id;
            const Icon = n.Icon;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  background: isActive ? T.bg3 : "transparent",
                  border: `1px solid ${isActive ? T.border : "transparent"}`,
                  color: isActive ? T.text0 : T.text2,
                  padding: "9px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  marginBottom: 2,
                  textAlign: "left",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                <span style={{ width: 18, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon active={isActive} />
                </span>
                {n.label}
                {isActive && (
                  <div
                    style={{
                      marginLeft: "auto",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: T.gold,
                    }}
                  />
                )}
              </button>
            );
          })}

          {/* Managed Properties */}
          {managed.length > 0 && (
            <>
              <div
                style={{
                  marginTop: 24,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: T.text3,
                  padding: "4px 10px 10px",
                }}
              >
                Managed
              </div>
              {managed.map((p) => {
                const occ = p.totalUnits > 0 ? pct(p.occupiedUnits, p.totalUnits) : 0;
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      marginBottom: 2,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.bg3)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => handleSelectManaged(p.id)}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{p.shortName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: occ >= 90 ? T.green : occ >= 75 ? T.amber : T.red }} />
                      <span style={{ fontSize: 10, color: T.text3 }}>
                        {p.occupiedUnits}/{p.totalUnits} units &middot; {occ}% occ
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Active Builds */}
          <div
            style={{
              marginTop: managed.length > 0 ? 16 : 24,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.text3,
              padding: "4px 10px 10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Active Builds</span>
            <button
              onClick={() => setShowAddJob(true)}
              style={{
                background: "transparent",
                border: "none",
                color: T.gold,
                fontSize: 14,
                cursor: "pointer",
                padding: "0 2px",
                lineHeight: 1,
              }}
              title="Add property"
            >
              +
            </button>
          </div>
          {builds.map((j) => {
            const currentDraw = j.draws[j.draws.length - 1];
            return (
              <div
                key={j.id}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  marginBottom: 2,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.bg3)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                onClick={() => handleSelectBuild(j.id)}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{j.shortName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: DRAW_STATUS[currentDraw.status].color }} />
                  <span style={{ fontSize: 10, color: T.text3 }}>
                    Draw #{currentDraw.num} &middot; {DRAW_STATUS[currentDraw.status].label}
                  </span>
                </div>
              </div>
            );
          })}
          {builds.length === 0 && (
            <div style={{ padding: "8px 12px", fontSize: 11, color: T.text3 }}>No active builds</div>
          )}
        </nav>

        {/* User section */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: T.goldDim,
                border: `1px solid ${T.goldBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: T.gold,
              }}
            >
              LD
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>Lorenzo D.</div>
              <div style={{ fontSize: 10, color: T.text3 }}>Principal</div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: T.green,
                boxShadow: `0 0 6px ${T.green}`,
              }}
            />
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 10,
              color: T.text3,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>AO Solutions</span>
            <span style={{ color: T.green }}>
              <svg width="6" height="6" viewBox="0 0 6 6" fill={T.green} style={{ marginRight: 4, verticalAlign: "middle" }}>
                <circle cx="3" cy="3" r="3" />
              </svg>
              Retainer Active
            </span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <header
          style={{
            height: 58,
            borderBottom: `1px solid ${T.border}`,
            background: T.bg1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 17,
                fontWeight: 700,
                color: T.text0,
                letterSpacing: "-0.01em",
              }}
            >
              {TITLES[view]}
            </div>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                background: T.bg2,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 11, color: T.text2 }}>Retainer start:</span>
              <Mono style={{ fontSize: 11, color: T.gold }}>Apr 1, 2026</Mono>
            </div>
            <button
              onClick={() => setShowAddJob(true)}
              style={{
                background: T.goldDim,
                border: `1px solid ${T.goldBorder}`,
                borderRadius: 8,
                color: T.gold,
                fontSize: 12,
                fontWeight: 600,
                padding: "7px 16px",
                cursor: "pointer",
                letterSpacing: "0.04em",
                fontFamily: "inherit",
              }}
            >
              + Add Property
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {view === "portfolio" && <PortfolioView onSelectManaged={handleSelectManaged} onSelectBuild={handleSelectBuild} />}
          {view === "properties" && <PropertiesView />}
          {view === "draws" && <DrawsView />}
          {view === "invoices" && <InvoicesView />}
        </main>
      </div>
    </div>
  );
}
