import React, { useState } from "react";
import { T } from "../data/jobs";

const fieldLabel = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T.text2,
  marginBottom: 6,
};

const input = {
  width: "100%",
  background: T.bg3,
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  color: T.text0,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  padding: "9px 12px",
  outline: "none",
};

const monoInput = {
  ...input,
  fontFamily: "'JetBrains Mono', monospace",
};

export default function AddJobModal({ onClose, onSubmit }) {
  const [category, setCategory] = useState("build");
  const [form, setForm] = useState({
    name: "",
    address: "",
    type: "Multi-Family",
    // build fields
    totalProjectCost: "",
    loanAmount: "",
    equityRequired: "",
    startDate: "",
    estCompletion: "",
    // managed fields
    totalUnits: "",
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const parseNum = (v) => parseFloat(String(v).replace(/[^0-9.]/g, "")) || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.address) return;

    if (category === "managed") {
      if (!form.totalUnits) return;
      onSubmit({
        category: "managed",
        name: form.name,
        address: form.address,
        type: form.type,
        totalUnits: parseNum(form.totalUnits),
      });
    } else {
      if (!form.loanAmount) return;
      onSubmit({
        category: "build",
        name: form.name,
        address: form.address,
        type: form.type,
        totalProjectCost: parseNum(form.totalProjectCost),
        loanAmount: parseNum(form.loanAmount),
        equityRequired: parseNum(form.equityRequired),
        startDate: form.startDate,
        estCompletion: form.estCompletion,
      });
    }
    onClose();
  };

  const tabStyle = (active) => ({
    flex: 1,
    background: active ? T.bg4 : "transparent",
    border: active ? `1px solid ${T.border}` : "1px solid transparent",
    color: active ? T.text0 : T.text2,
    fontSize: 12,
    fontWeight: 600,
    padding: "7px 0",
    borderRadius: 7,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: T.bg2,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: "28px 30px 24px",
          width: 440,
          maxWidth: "90vw",
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 17,
            fontWeight: 700,
            color: T.text0,
            marginBottom: 20,
          }}
        >
          Add Property
        </div>

        {/* Category toggle */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            background: T.bg3,
            borderRadius: 10,
            padding: 4,
            border: `1px solid ${T.border}`,
          }}
        >
          <button type="button" onClick={() => setCategory("build")} style={tabStyle(category === "build")}>
            Active Build
          </button>
          <button type="button" onClick={() => setCategory("managed")} style={tabStyle(category === "managed")}>
            Managed Property
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={fieldLabel}>Property Name *</div>
            <input
              style={input}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={category === "managed" ? "e.g. West Village Apartments" : "e.g. The Legion"}
              required
            />
          </div>

          <div>
            <div style={fieldLabel}>Address *</div>
            <input
              style={input}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 849 American Legion Dr"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={fieldLabel}>Type</div>
              <select
                style={{ ...input, cursor: "pointer" }}
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="Multi-Family">Multi-Family</option>
                <option value="Single-Family">Single-Family</option>
                <option value="Mixed-Use">Mixed-Use</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
            {category === "managed" ? (
              <div>
                <div style={fieldLabel}>Total Units *</div>
                <input
                  style={monoInput}
                  value={form.totalUnits}
                  onChange={(e) => set("totalUnits", e.target.value)}
                  placeholder="200"
                  required
                />
              </div>
            ) : (
              <div>
                <div style={fieldLabel}>Total Project Cost</div>
                <input
                  style={monoInput}
                  value={form.totalProjectCost}
                  onChange={(e) => set("totalProjectCost", e.target.value)}
                  placeholder="26,000,000"
                />
              </div>
            )}
          </div>

          {category === "build" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={fieldLabel}>Loan Amount *</div>
                  <input
                    style={monoInput}
                    value={form.loanAmount}
                    onChange={(e) => set("loanAmount", e.target.value)}
                    placeholder="20,800,000"
                    required
                  />
                </div>
                <div>
                  <div style={fieldLabel}>Equity Required</div>
                  <input
                    style={monoInput}
                    value={form.equityRequired}
                    onChange={(e) => set("equityRequired", e.target.value)}
                    placeholder="5,200,000"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={fieldLabel}>Start Date</div>
                  <input
                    style={input}
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    placeholder="e.g. Mar 2026"
                  />
                </div>
                <div>
                  <div style={fieldLabel}>Est. Completion</div>
                  <input
                    style={input}
                    value={form.estCompletion}
                    onChange={(e) => set("estCompletion", e.target.value)}
                    placeholder="e.g. Dec 2027"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 28,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${T.border}`,
              borderRadius: 7,
              color: T.text2,
              fontSize: 12,
              fontWeight: 600,
              padding: "8px 18px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              background: T.goldDim,
              border: `1px solid ${T.goldBorder}`,
              borderRadius: 7,
              color: T.gold,
              fontSize: 12,
              fontWeight: 600,
              padding: "8px 20px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Create Property
          </button>
        </div>
      </form>
    </div>
  );
}
