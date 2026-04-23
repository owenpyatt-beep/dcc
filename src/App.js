import React, { useState, useEffect } from "react";
import {
  Building2,
  Layers,
  Database,
  FileText,
  Plus,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { DRAW_STATUS } from "./data/jobs";
import { pct } from "./utils/format";
import { useJobs } from "./context/JobsContext";
import { useAuth } from "./context/AuthContext";
import PropertiesView from "./components/PropertiesView";
import DrawsView from "./components/DrawsView";
import InvoiceDatabaseView from "./components/InvoiceDatabaseView";
import LjldView from "./components/LjldView";
import AddJobModal from "./components/AddJobModal";
import LoginPage from "./components/LoginPage";
import PrivacyPage from "./components/PrivacyPage";
import TermsPage from "./components/TermsPage";
import { LED, StatusPill } from "./components/ui/LED";
import { Button } from "./components/ui/Button";
import { Stamp } from "./components/ui/Typography";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

const NAV = [
  { id: "properties", label: "Properties", Icon: Building2 },
  { id: "ljld", label: "LJLD LLC", Icon: FileText },
  { id: "draws", label: "Draws", Icon: Layers },
  { id: "invoice-db", label: "Invoice Database", Icon: Database },
];

const TITLES = {
  properties: "Properties",
  draws: "Draws",
  "invoice-db": "Invoice Database",
  ljld: "LJLD LLC",
};

function BootScreen({ message = "Loading...", error = null }) {
  return (
    <div className="min-h-screen w-full bg-chassis flex items-center justify-center p-6">
      <div className="text-center">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl font-extrabold text-white text-xl"
          style={{
            background:
              "linear-gradient(135deg, #ff4757 0%, #c1323e 100%)",
            boxShadow:
              "6px 6px 14px rgba(166,50,60,0.45), -4px -4px 10px rgba(255,120,130,0.4), inset 1px 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          D
        </div>
        <div className="text-[22px] font-bold text-ink emboss mb-1.5">
          Debrecht Command Center
        </div>
        {!error ? (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-md bg-chassis shadow-recessed-sm">
            <LED color="amber" size={8} pulse />
            <Stamp>{message}</Stamp>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-md bg-chassis shadow-recessed-sm">
              <LED color="red" size={8} pulse />
              <Stamp className="text-[#b91c1c]">Connection failed</Stamp>
            </div>
            <div className="mt-4 max-w-md mx-auto text-xs font-mono text-label/80 break-all">
              {error}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Brand({ onClose }) {
  return (
    <div className="px-5 py-5 border-b border-[rgba(74,85,104,0.1)] flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl font-extrabold text-white text-sm shrink-0"
        style={{
          background: "linear-gradient(135deg, #ff4757 0%, #c1323e 100%)",
          boxShadow:
            "3px 3px 8px rgba(166,50,60,0.45), -2px -2px 6px rgba(255,120,130,0.35), inset 1px 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        D
      </div>
      <div className="leading-tight">
        <div className="text-[13px] font-bold text-ink">Debrecht</div>
        <Stamp className="text-[8px]">Command Center</Stamp>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto rounded-md p-1.5 text-label press hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function NavButton({ active, onClick, Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={
        "press flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all " +
        (active
          ? "text-ink shadow-pressed"
          : "text-label hover:text-ink hover:shadow-recessed-sm")
      }
    >
      <Icon
        className="h-4 w-4"
        strokeWidth={active ? 2.2 : 1.6}
        style={{ color: active ? "#ff4757" : undefined }}
      />
      <span className={active ? "font-semibold" : ""}>{label}</span>
      {active && (
        <span className="ml-auto">
          <LED color="accent" size={7} pulse />
        </span>
      )}
    </button>
  );
}

function SectionHeader({ children, action }) {
  return (
    <div className="flex items-center justify-between px-3 pt-5 pb-2">
      <Stamp className="text-[9px] text-label/80">{children}</Stamp>
      {action}
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;
  const { user, loading: authLoading, signOut } = useAuth();
  const { properties, builds, addProperty, loading, error: dataError } = useJobs();
  const [view, setView] = useState("properties");
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [selectedBuildId, setSelectedBuildId] = useState(null);
  const [selectedLjldPropertyId, setSelectedLjldPropertyId] = useState(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Public pages — no auth required
  if (path === "/privacy") return <PrivacyPage />;
  if (path === "/terms") return <TermsPage />;

  if (authLoading) return <BootScreen message="Authenticating..." />;
  if (!user) return <LoginPage />;
  if (loading) return <BootScreen message="Loading data..." />;
  if (dataError) return <BootScreen error={dataError} />;

  const handleSelectProperty = (id) => {
    setSelectedPropertyId(id);
    setView("properties");
    setSidebarOpen(false);
  };

  const handleGoToDraws = (id) => {
    setSelectedBuildId(id);
    setView("draws");
    setSidebarOpen(false);
  };

  const handleGoToLjld = (id) => {
    if (id) setSelectedLjldPropertyId(id);
    setView("ljld");
    setSidebarOpen(false);
  };

  const handleNav = (id) => {
    setView(id);
    setSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      <Brand onClose={isMobile ? () => setSidebarOpen(false) : null} />

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <SectionHeader>Navigation</SectionHeader>
        <div className="space-y-1">
          {NAV.map((n) => (
            <NavButton
              key={n.id}
              active={view === n.id}
              onClick={() => handleNav(n.id)}
              Icon={n.Icon}
              label={n.label}
            />
          ))}
        </div>

        <SectionHeader
          action={
            <button
              onClick={() => {
                setShowAddJob(true);
                setSidebarOpen(false);
              }}
              className="press flex h-6 w-6 items-center justify-center rounded-full text-accent shadow-card hover:shadow-floating"
              title="Add property"
            >
              <Plus className="h-3 w-3" strokeWidth={2.5} />
            </button>
          }
        >
          Properties
        </SectionHeader>
        <div className="space-y-1">
          {properties.map((p) => {
            const isBuild = p.category === "build";
            let ledColor = "amber";
            let meta = "";
            if (isBuild) {
              const jDraws = p.draws || [];
              const currentDraw = jDraws[jDraws.length - 1];
              const statusKey = currentDraw?.status;
              ledColor = statusKey === "funded" ? "green" : "purple";
              meta = currentDraw
                ? `Draw #${currentDraw.num} · ${DRAW_STATUS[statusKey]?.label || ""}`
                : "No draws";
            } else {
              const occ = p.totalUnits > 0 ? pct(p.occupiedUnits, p.totalUnits) : 0;
              ledColor = occ >= 90 ? "green" : occ >= 75 ? "amber" : "red";
              meta = p.totalUnits > 0
                ? `${occ}% · ${p.occupiedUnits}/${p.totalUnits}`
                : "No units set";
            }
            return (
              <button
                key={p.id}
                onClick={() => handleSelectProperty(p.id)}
                className="press w-full rounded-xl px-3 py-2.5 text-left hover:shadow-recessed-sm transition-all"
              >
                <div className="text-[12px] font-semibold text-ink">
                  {p.shortName || p.name}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <LED color={ledColor} size={6} pulse={false} />
                  <span className="text-[10px] font-mono text-label truncate">
                    {meta}
                  </span>
                </div>
              </button>
            );
          })}
          {properties.length === 0 && (
            <div className="px-3 py-2 text-[11px] font-mono text-label/80">
              No properties yet
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar footer — system status plate */}
      <div className="border-t border-[rgba(74,85,104,0.1)] px-5 py-3 flex items-center justify-between">
        <StatusPill color="green" label="Operational" pulse />
        <Stamp className="text-[8px] text-label/70">v1.0</Stamp>
      </div>
    </>
  );

  return (
    <div
      className={
        "min-h-screen bg-chassis text-ink flex " +
        (isMobile ? "flex-col pb-[60px]" : "flex-row")
      }
    >
      {showAddJob && (
        <AddJobModal
          onClose={() => setShowAddJob(false)}
          onSubmit={addProperty}
        />
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside
          className="w-[240px] shrink-0 sticky top-0 h-screen flex flex-col bg-chassis border-r border-[rgba(74,85,104,0.1)]"
          style={{
            boxShadow: "2px 0 8px rgba(186,190,204,0.25)",
          }}
        >
          {sidebarContent}
        </aside>
      )}

      {/* Mobile slide-in sidebar */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <aside className="relative z-10 w-[280px] h-screen flex flex-col bg-chassis overflow-y-auto shadow-floating">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header plate */}
        <header
          className={
            "sticky top-0 z-10 flex items-center justify-between border-b border-[rgba(74,85,104,0.08)] bg-chassis " +
            (isMobile ? "h-14 px-4" : "h-[72px] px-8")
          }
          style={{
            boxShadow: "0 4px 12px rgba(186,190,204,0.25)",
          }}
        >
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="press flex h-10 w-10 items-center justify-center rounded-xl shadow-card"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <div>
              <div
                className={
                  (isMobile ? "text-[15px]" : "text-lg") +
                  " font-bold text-ink emboss leading-tight tracking-tight"
                }
              >
                {TITLES[view]}
              </div>
              {!isMobile && (
                <Stamp className="text-[9px] mt-0.5">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Stamp>
              )}
            </div>
          </div>
          {!isMobile && (
            <div className="flex items-center gap-3">
              <StatusPill color="green" label="Live" />
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowAddJob(true)}
                iconLeft={<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
              >
                Add Property
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                iconLeft={<LogOut className="h-3 w-3" />}
              >
                Sign Out
              </Button>
            </div>
          )}
        </header>

        {/* Content */}
        <main
          className={
            "flex-1 overflow-y-auto " +
            (isMobile ? "p-4" : "px-8 py-8")
          }
        >
          {view === "properties" && (
            <PropertiesView
              selectedId={selectedPropertyId}
              onGoToDraws={handleGoToDraws}
            />
          )}
          {view === "draws" && (
            <DrawsView
              selectedId={selectedBuildId}
              onGoToLjld={handleGoToLjld}
            />
          )}
          {view === "invoice-db" && <InvoiceDatabaseView />}
          {view === "ljld" && (
            <LjldView selectedPropertyId={selectedLjldPropertyId} />
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 h-[60px] z-20 bg-chassis border-t border-[rgba(74,85,104,0.08)] flex items-center justify-around"
          style={{
            boxShadow: "0 -4px 12px rgba(186,190,204,0.3)",
          }}
        >
          {NAV.map((n) => {
            const isActive = view === n.id;
            const Icon = n.Icon;
            return (
              <button
                key={n.id}
                onClick={() => handleNav(n.id)}
                className="press flex flex-col items-center gap-1 px-3 py-1.5"
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2.2 : 1.6}
                  style={{
                    color: isActive ? "#ff4757" : "#4a5568",
                  }}
                />
                <span
                  className={
                    "text-[9px] font-mono uppercase tracking-[0.08em] " +
                    (isActive ? "text-accent font-bold" : "text-label")
                  }
                >
                  {n.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
