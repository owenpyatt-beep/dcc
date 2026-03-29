import React, { useState } from 'react';

const NAV_ITEMS = [
  { key: 'portfolio', label: 'Portfolio', icon: PortfolioIcon },
  { key: 'draws', label: 'Draws', icon: DrawsIcon },
  { key: 'invoices', label: 'Invoices', icon: InvoicesIcon },
];

function PortfolioIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="3" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DrawsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10h14M3 5h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="5" r="1.5" fill="currentColor" />
      <circle cx="13" cy="10" r="1.5" fill="currentColor" />
      <circle cx="9" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

function InvoicesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 2h7l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PortfolioView() {
  return (
    <div style={styles.placeholder}>
      <span style={styles.placeholderLabel}>Portfolio</span>
      <span style={styles.placeholderSub}>Property overview coming soon</span>
    </div>
  );
}

function DrawsView() {
  return (
    <div style={styles.placeholder}>
      <span style={styles.placeholderLabel}>Draws</span>
      <span style={styles.placeholderSub}>Draw tracking coming soon</span>
    </div>
  );
}

function InvoicesView() {
  return (
    <div style={styles.placeholder}>
      <span style={styles.placeholderLabel}>Invoices</span>
      <span style={styles.placeholderSub}>Invoice management coming soon</span>
    </div>
  );
}

const VIEWS = {
  portfolio: PortfolioView,
  draws: DrawsView,
  invoices: InvoicesView,
};

export default function App() {
  const [activeView, setActiveView] = useState('portfolio');
  const ActiveComponent = VIEWS[activeView];
  const activeLabel = NAV_ITEMS.find((n) => n.key === activeView).label;

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandText}>DCC</span>
          <span style={styles.brandSub}>Command Center</span>
        </div>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
              >
                <span style={{ color: isActive ? '#c9a96e' : '#6a6560' }}>
                  <Icon />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>{activeLabel}</h1>
        </header>
        <div style={styles.content}>
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  sidebar: {
    width: 240,
    minWidth: 240,
    background: '#0e0f10',
    borderRight: '1px solid #1e1f21',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0 24px 32px',
    borderBottom: '1px solid #1e1f21',
    marginBottom: 24,
  },
  brandText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: 700,
    color: '#c9a96e',
    letterSpacing: '0.04em',
  },
  brandSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: '#6a6560',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '0 12px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    border: 'none',
    background: 'transparent',
    color: '#a8a39a',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 8,
    transition: 'background 0.15s, color 0.15s',
    textAlign: 'left',
    width: '100%',
  },
  navItemActive: {
    background: '#1a1b1d',
    color: '#f2ede4',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '24px 32px 20px',
    borderBottom: '1px solid #1e1f21',
  },
  headerTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    fontWeight: 600,
    color: '#f2ede4',
    margin: 0,
  },
  content: {
    flex: 1,
    padding: 32,
    overflow: 'auto',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 8,
  },
  placeholderLabel: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    color: '#a8a39a',
  },
  placeholderSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: '#6a6560',
  },
};
