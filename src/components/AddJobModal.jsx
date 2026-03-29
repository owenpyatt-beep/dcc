import React, { useState } from "react";
import { T } from "../data/jobs";

const field = (label) => ({
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T.text2,
  marginBottom: 6,
});

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
  const [form, setForm] = useState({
    name: "",
    address: "",
    type: "Multi-Family",
    loanAmount: "",
    startDate: "",
    estCompletion: "",
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.loanAmount) return;
    onSubmit({
      ...form,
      loanAmount: parseFloat(form.loanAmount.replace(/[^0-9.]/g, "")) || 0,
    });
    onClose();
  };

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
          width: 420,
          maxWidth: "90vw",
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 17,
            fontWeight: 700,
            color: T.text0,
            marginBottom: 24,
          }}
        >
          Add New Project
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={field()}>Project Name *</div>
            <input
              style={input}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Elmwood Flats"
              required
            />
          </div>

          <div>
            <div style={field()}>Address *</div>
            <input
              style={input}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 4412 Elmwood Ave, St. Louis, MO"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={field()}>Type</div>
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
            <div>
              <div style={field()}>Loan Amount *</div>
              <input
                style={monoInput}
                value={form.loanAmount}
                onChange={(e) => set("loanAmount", e.target.value)}
                placeholder="2,400,000"
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={field()}>Start Date</div>
              <input
                style={input}
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                placeholder="e.g. Mar 2026"
              />
            </div>
            <div>
              <div style={field()}>Est. Completion</div>
              <input
                style={input}
                value={form.estCompletion}
                onChange={(e) => set("estCompletion", e.target.value)}
                placeholder="e.g. Dec 2027"
              />
            </div>
          </div>
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
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}
