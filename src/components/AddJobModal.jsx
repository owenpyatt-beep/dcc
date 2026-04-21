import React, { useState } from "react";
import { X, Building2, Hammer } from "lucide-react";
import { Input, Select, Label } from "./ui/Input";
import { Button } from "./ui/Button";
import { Stamp } from "./ui/Typography";
import { Panel } from "./ui/Panel";

function CategoryTab({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "press flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[12px] font-mono uppercase tracking-[0.08em] font-bold transition-all " +
        (active
          ? "bg-chassis text-ink shadow-pressed"
          : "text-label hover:text-ink")
      }
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      {children}
    </button>
  );
}

export default function AddJobModal({ onClose, onSubmit }) {
  const [category, setCategory] = useState("build");
  const [form, setForm] = useState({
    name: "",
    address: "",
    type: "Multi-Family",
    totalProjectCost: "",
    loanAmount: "",
    equityRequired: "",
    startDate: "",
    estCompletion: "",
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: "rgba(30, 38, 48, 0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <Panel
        as="form"
        elevated
        screws
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-[480px] max-w-full p-8 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="press absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-label shadow-card hover:text-ink hover:shadow-floating"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="mb-1">
          <Stamp className="text-[10px]">New Module</Stamp>
        </div>
        <div className="text-[22px] font-bold text-ink emboss tracking-tight mb-6">
          Add Property
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-chassis shadow-recessed">
          <CategoryTab
            active={category === "build"}
            onClick={() => setCategory("build")}
            icon={Hammer}
          >
            Active Build
          </CategoryTab>
          <CategoryTab
            active={category === "managed"}
            onClick={() => setCategory("managed")}
            icon={Building2}
          >
            Managed
          </CategoryTab>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Label>Property Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={
                category === "managed"
                  ? "e.g. West Village Apartments"
                  : "e.g. The Legion"
              }
              required
            />
          </div>

          <div>
            <Label>Address *</Label>
            <Input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 849 American Legion Dr"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="Multi-Family">Multi-Family</option>
                <option value="Single-Family">Single-Family</option>
                <option value="Mixed-Use">Mixed-Use</option>
                <option value="Commercial">Commercial</option>
              </Select>
            </div>
            {category === "managed" ? (
              <div>
                <Label>Total Units *</Label>
                <Input
                  value={form.totalUnits}
                  onChange={(e) => set("totalUnits", e.target.value)}
                  placeholder="200"
                  required
                />
              </div>
            ) : (
              <div>
                <Label>Total Project Cost</Label>
                <Input
                  value={form.totalProjectCost}
                  onChange={(e) => set("totalProjectCost", e.target.value)}
                  placeholder="26,000,000"
                />
              </div>
            )}
          </div>

          {category === "build" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Loan Amount *</Label>
                  <Input
                    value={form.loanAmount}
                    onChange={(e) => set("loanAmount", e.target.value)}
                    placeholder="20,800,000"
                    required
                  />
                </div>
                <div>
                  <Label>Equity Required</Label>
                  <Input
                    value={form.equityRequired}
                    onChange={(e) => set("equityRequired", e.target.value)}
                    placeholder="5,200,000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    placeholder="Mar 2026"
                  />
                </div>
                <div>
                  <Label>Est. Completion</Label>
                  <Input
                    value={form.estCompletion}
                    onChange={(e) => set("estCompletion", e.target.value)}
                    placeholder="Dec 2027"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-[rgba(74,85,104,0.1)]">
          <Button variant="secondary" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit">
            Create Property
          </Button>
        </div>
      </Panel>
    </div>
  );
}
