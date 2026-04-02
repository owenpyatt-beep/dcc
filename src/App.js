import React, { useState, useEffect } from "react";
import { T, DRAW_STATUS } from "./data/jobs";
import { pct } from "./utils/format";
import { useJobs } from "./context/JobsContext";
import PortfolioView from "./components/PortfolioView";
import PropertiesView from "./components/PropertiesView";
import DrawsView from "./components/DrawsView";
import InvoicesView from "./components/InvoicesView";
import AddJobModal from "./components/AddJobModal";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSelectManaged = (id) => {
    setView("properties");
    setSidebarOpen(false);
  };

  const handleSelectBuild = (id) => {
    setView("draws");
    setSidebarOpen(false);
  };

  const handleNav = (id) => {
    setView(id);
    setSidebarOpen(false);
  };

  // Sidebar content (shared between desktop sidebar and mobile overlay)
  const sidebarContent = (
    <>
      {/* Brand */}
      <div style={{ padding: "22px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${T.gold}, #9e7a3a)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: T.bg0, flexShrink: 0 }}>D</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: T.text0, lineHeight: 1.1 }}>Debrecht</div>
            <div style={{ fontSize: 9, color: T.text3, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>Command Center</div>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: T.text2, fontSize: 20, cursor: "pointer", padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
        {!isMobile && (
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.text3, padding: "4px 10px 10px" }}>Navigation</div>
        )}
        {!isMobile && NAV.map((n) => {
          const isActive = view === n.id;
          const Icon = n.Icon;
          return (
            <button key={n.id} onClick={() => handleNav(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: isActive ? T.bg3 : "transparent", border: `1px solid ${isActive ? T.border : "transparent"}`, color: isActive ? T.text0 : T.text2, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 400, marginBottom: 2, textAlign: "left", transition: "all 0.15s", fontFamily: "inherit" }}>
              <span style={{ width: 18, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon active={isActive} /></span>
              {n.label}
              {isActive && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: T.gold }} />}
            </button>
          );
        })}

        {/* Managed Properties */}
        {managed.length > 0 && (
          <>
            <div style={{ marginTop: isMobile ? 0 : 24, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.text3, padding: "4px 10px 10px" }}>Managed</div>
            {managed.map((p) => {
              const occ = p.totalUnits > 0 ? pct(p.occupiedUnits, p.totalUnits) : 0;
              return (
                <div key={p.id} style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 2, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.bg3)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => handleSelectManaged(p.id)}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{p.shortName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: occ >= 90 ? T.green : occ >= 75 ? T.amber : T.red }} />
                    <span style={{ fontSize: 10, color: T.text3 }}>{p.occupiedUnits}/{p.totalUnits} units &middot; {occ}% occ</span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Active Builds */}
        <div style={{ marginTop: managed.length > 0 ? 16 : isMobile ? 0 : 24, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.text3, padding: "4px 10px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Active Builds</span>
          <button onClick={() => { setShowAddJob(true); setSidebarOpen(false); }} style={{ background: "transparent", border: "none", color: T.gold, fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1 }} title="Add property">+</button>
        </div>
        {builds.map((j) => {
          const currentDraw = j.draws[j.draws.length - 1];
          return (
            <div key={j.id} style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 2, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.bg3)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => handleSelectBuild(j.id)}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{j.shortName}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: DRAW_STATUS[currentDraw.status].color }} />
                <span style={{ fontSize: 10, color: T.text3 }}>Draw #{currentDraw.num} &middot; {DRAW_STATUS[currentDraw.status].label}</span>
              </div>
            </div>
          );
        })}
        {builds.length === 0 && <div style={{ padding: "8px 12px", fontSize: 11, color: T.text3 }}>No active builds</div>}
      </nav>

    </>
  );

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        background: T.bg0,
        minHeight: "100vh",
        color: T.text0,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        fontSize: 14,
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.4s ease",
        paddingBottom: isMobile ? 60 : 0,
      }}
    >
      {showAddJob && (
        <AddJobModal onClose={() => setShowAddJob(false)} onSubmit={addProperty} />
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{ width: 220, flexShrink: 0, background: T.bg1, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
          {sidebarContent}
        </aside>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={() => setSidebarOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <aside style={{ width: 280, background: T.bg1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, height: "100vh", overflowY: "auto" }}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <header
          style={{
            height: isMobile ? 50 : 58,
            borderBottom: `1px solid ${T.border}`,
            background: T.bg1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "0 16px" : "0 32px",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ background: "transparent", border: "none", color: T.text1, cursor: "pointer", padding: 4, display: "flex" }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 15 : 17, fontWeight: 700, color: T.text0, letterSpacing: "-0.01em" }}>{TITLES[view]}</div>
              {!isMobile && (
                <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>
                  {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
              )}
            </div>
          </div>
          {!isMobile && (
            <button onClick={() => setShowAddJob(true)} style={{ background: T.goldDim, border: `1px solid ${T.goldBorder}`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 600, padding: "7px 16px", cursor: "pointer", letterSpacing: "0.04em", fontFamily: "inherit" }}>+ Add Property</button>
          )}
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: isMobile ? "16px" : "28px 32px", overflowY: "auto" }}>
          {view === "portfolio" && <PortfolioView onSelectManaged={handleSelectManaged} onSelectBuild={handleSelectBuild} />}
          {view === "properties" && <PropertiesView />}
          {view === "draws" && <DrawsView />}
          {view === "invoices" && <InvoicesView />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: T.bg1,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 20,
        }}>
          {NAV.map((n) => {
            const isActive = view === n.id;
            const Icon = n.Icon;
            return (
              <button
                key={n.id}
                onClick={() => handleNav(n.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  padding: "6px 12px",
                }}
              >
                <Icon active={isActive} />
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? T.gold : T.text3, letterSpacing: "0.04em" }}>{n.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
