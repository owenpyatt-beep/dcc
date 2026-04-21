import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowRight, Building, Hammer } from "lucide-react";
import {
  fc,
  pct,
  short,
  Mono,
  Badge,
  StatusDot,
  ProgressBar,
  KpiCard,
  ChartTip,
  COLORS,
} from "../utils/format";
import { useJobs } from "../context/JobsContext";
import AskBar from "./AskBar";
import { Stamp } from "./ui/Typography";
import { LED } from "./ui/LED";

function SectionLabel({ icon: Icon, children, count }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chassis shadow-recessed-sm">
        {Icon && <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />}
      </div>
      <Stamp className="text-[11px]">{children}</Stamp>
      {count !== undefined && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 bg-chassis shadow-recessed-sm">
          <Mono className="text-[9px] font-bold text-label">{count}</Mono>
        </span>
      )}
      <div className="flex-1 h-px bg-[rgba(74,85,104,0.08)]" />
    </div>
  );
}

function MiniStat({ label, value, sub }) {
  return (
    <div className="rounded-lg bg-chassis p-3 shadow-recessed-sm">
      <Stamp className="text-[8px]">{label}</Stamp>
      <Mono className="block mt-1.5 text-[13px] font-bold text-ink">
        {value}
      </Mono>
      {sub && (
        <div className="mt-1 text-[10px] font-mono text-label">{sub}</div>
      )}
    </div>
  );
}

function PropertyCard({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl bg-chassis p-6 shadow-card screws transition-all duration-300 ease-mechanical hover:-translate-y-1 hover:shadow-floating relative"
    >
      {children}
    </div>
  );
}

export default function PortfolioView({ onSelectManaged, onSelectBuild }) {
  const { builds, managed } = useJobs();

  // ── Managed KPIs ────────────────────────────────────
  const totalManagedUnits = managed.reduce((s, p) => s + p.totalUnits, 0);
  const totalOccupied = managed.reduce((s, p) => s + p.occupiedUnits, 0);
  const totalMonthlyIncome = managed.reduce((s, p) => s + p.monthlyIncome, 0);
  const totalCollected = managed.reduce((s, p) => s + p.collectedIncome, 0);
  const overallOccPct =
    totalManagedUnits > 0 ? pct(totalOccupied, totalManagedUnits) : 0;
  const totalLate = managed.reduce(
    (s, p) => s + p.delinquent30 + p.delinquent60,
    0
  );
  const totalLateAmount = managed.reduce(
    (s, p) => s + p.delinquentAmount30 + p.delinquentAmount60,
    0
  );

  // ── Build KPIs ──────────────────────────────────────
  const totalLoan = builds.reduce((s, j) => s + j.loanAmount, 0);
  const totalDrawn = builds.reduce((s, j) => s + j.drawnToDate, 0);
  const totalPending = builds.reduce(
    (s, j) =>
      s +
      (j.draws || [])
        .filter((d) => d.status !== "funded")
        .reduce((ss, d) => ss + d.amount, 0),
    0
  );
  const totalFunded = builds.reduce(
    (s, j) =>
      s +
      (j.draws || [])
        .filter((d) => d.status === "funded")
        .reduce((ss, d) => ss + d.amount, 0),
    0
  );
  const fundedDrawCount = builds.reduce(
    (s, j) => s + (j.draws || []).filter((d) => d.status === "funded").length,
    0
  );

  const loanData = builds.map((j) => {
    const pending = (j.draws || [])
      .filter((d) => d.status !== "funded")
      .reduce((ss, d) => ss + d.amount, 0);
    return {
      name: j.shortName,
      Drawn: j.drawnToDate,
      Pending: pending,
      Available: Math.max(0, j.loanAmount - j.drawnToDate - pending),
    };
  });

  const combinedCashflow = (() => {
    const allMonths = [];
    const seen = new Set();
    builds.forEach((j) =>
      (j.cashflow || []).forEach((r) => {
        if (!seen.has(r.month)) {
          seen.add(r.month);
          allMonths.push(r.month);
        }
      })
    );
    return allMonths.map((m) => {
      const row = { month: m };
      builds.forEach((j) => {
        const entry = (j.cashflow || []).find((r) => r.month === m);
        row[j.shortName] = entry ? entry.drawn : 0;
      });
      return row;
    });
  })();

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <AskBar />
      </div>

      {managed.length > 0 && (
        <section className="mb-12">
          <SectionLabel icon={Building} count={managed.length}>
            Managed Properties
          </SectionLabel>

          <div className="grid-4 mb-6">
            <KpiCard
              label="Total Units"
              value={totalManagedUnits.toLocaleString()}
              sub={`${managed.length} properties`}
              accent="#ff4757"
            />
            <KpiCard
              label="Occupancy"
              value={`${overallOccPct}%`}
              sub={`${totalOccupied} of ${totalManagedUnits} occupied`}
              accent={overallOccPct >= 90 ? "#22c55e" : "#f59e0b"}
            />
            <KpiCard
              label="Monthly Income"
              value={totalMonthlyIncome > 0 ? fc(totalMonthlyIncome) : "—"}
              sub={
                totalMonthlyIncome > 0
                  ? `${pct(totalCollected, totalMonthlyIncome)}% collected`
                  : "Not yet entered"
              }
              accent="#ff4757"
            />
            <KpiCard
              label="Late Payments"
              value={totalLate > 0 ? `${totalLate} units` : "0"}
              sub={fc(totalLateAmount) + " outstanding"}
              accent={totalLate > 0 ? "#ef4444" : "#22c55e"}
            />
          </div>

          <div className="grid-2">
            {managed.map((prop) => {
              const occ =
                prop.totalUnits > 0
                  ? pct(prop.occupiedUnits, prop.totalUnits)
                  : 0;
              const leased =
                prop.totalUnits > 0
                  ? pct(prop.leasedUnits, prop.totalUnits)
                  : 0;
              return (
                <PropertyCard
                  key={prop.id}
                  onClick={() => onSelectManaged(prop.id)}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="text-lg font-bold text-ink emboss tracking-tight">
                        {prop.name}
                      </div>
                      <div className="mt-1 text-[11px] font-mono text-label">
                        {prop.address}
                      </div>
                    </div>
                    <Badge label="Managed" ledColor="green" />
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <Stamp className="text-[9px]">Occupancy</Stamp>
                      <Mono className="text-[11px] text-label">
                        {occ}% · {prop.occupiedUnits} of {prop.totalUnits}
                      </Mono>
                    </div>
                    <ProgressBar
                      value={prop.occupiedUnits}
                      max={prop.totalUnits || 1}
                      color={occ >= 90 ? "#22c55e" : "#f59e0b"}
                      height={6}
                    />
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between mb-2">
                      <Stamp className="text-[9px]">Leased</Stamp>
                      <Mono className="text-[11px] text-label">{leased}%</Mono>
                    </div>
                    <ProgressBar
                      value={prop.leasedUnits}
                      max={prop.totalUnits || 1}
                      color="#3b82f6"
                      height={4}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat
                      label="Units"
                      value={prop.totalUnits}
                      sub={prop.type}
                    />
                    <MiniStat
                      label="Income"
                      value={
                        prop.monthlyIncome > 0 ? fc(prop.monthlyIncome) : "—"
                      }
                      sub="monthly"
                    />
                    <MiniStat
                      label="Late"
                      value={prop.delinquent30 + prop.delinquent60}
                      sub={
                        prop.delinquent30 + prop.delinquent60 > 0
                          ? fc(
                              prop.delinquentAmount30 + prop.delinquentAmount60
                            )
                          : "all current"
                      }
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-1.5 text-[10px] font-mono uppercase tracking-[0.1em] text-label group-hover:text-accent transition-colors">
                    View details
                    <ArrowRight
                      className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </div>
                </PropertyCard>
              );
            })}
          </div>
        </section>
      )}

      {builds.length > 0 && (
        <section>
          <SectionLabel icon={Hammer} count={builds.length}>
            Active Builds
          </SectionLabel>

          <div className="grid-4 mb-6">
            <KpiCard
              label="Total Loan"
              value={short(totalLoan)}
              sub={`${builds.length} active builds`}
              accent="#ff4757"
            />
            <KpiCard
              label="Total Drawn"
              value={short(totalDrawn)}
              sub={
                totalLoan > 0
                  ? `${pct(totalDrawn, totalLoan)}% of loan`
                  : "No draws yet"
              }
              accent="#3b82f6"
            />
            <KpiCard
              label="Pending Approval"
              value={fc(totalPending)}
              sub="Awaiting funding"
              accent="#f59e0b"
            />
            <KpiCard
              label="Total Funded"
              value={short(totalFunded)}
              sub={`${fundedDrawCount} draws settled`}
              accent="#22c55e"
            />
          </div>

          {builds.length > 0 && loanData.length > 0 && (
            <div className="grid-chart mb-6">
              <div className="rounded-2xl bg-chassis p-6 shadow-card">
                <div className="flex items-center justify-between mb-5">
                  <Stamp>Loan Balance by Project</Stamp>
                  <LED color="accent" size={8} pulse />
                </div>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(140, builds.length * 64)}
                >
                  <BarChart data={loanData} layout="vertical" barCategoryGap="35%">
                    <CartesianGrid
                      horizontal={false}
                      stroke="rgba(74,85,104,0.1)"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => short(v)}
                      tick={{ fill: "#4a5568", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "#2d3436", fontSize: 12, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      width={78}
                    />
                    <Tooltip
                      content={<ChartTip />}
                      cursor={{ fill: "rgba(74,85,104,0.05)" }}
                    />
                    <Bar dataKey="Drawn" stackId="a" fill="#ff4757" name="Drawn" />
                    <Bar dataKey="Pending" stackId="a" fill="#f59e0b" name="Pending" />
                    <Bar
                      dataKey="Available"
                      stackId="a"
                      fill="#d1d9e6"
                      radius={[0, 4, 4, 0]}
                      name="Available"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-5 mt-3">
                  {[
                    ["Drawn", "#ff4757"],
                    ["Pending", "#f59e0b"],
                    ["Available", "#d1d9e6"],
                  ].map(([l, c]) => (
                    <div
                      key={l}
                      className="flex items-center gap-2 text-[10px] font-mono text-label"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: c }}
                      />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              {combinedCashflow.length > 0 && (
                <div className="rounded-2xl bg-chassis p-6 shadow-card">
                  <div className="flex items-center justify-between mb-5">
                    <Stamp>Monthly Draws</Stamp>
                    <LED color="blue" size={8} pulse />
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={combinedCashflow} barCategoryGap="25%">
                      <CartesianGrid
                        vertical={false}
                        stroke="rgba(74,85,104,0.1)"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#4a5568", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) =>
                          v >= 1000 ? `${v / 1000}K` : v
                        }
                        tick={{ fill: "#4a5568", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<ChartTip />}
                        cursor={{ fill: "rgba(74,85,104,0.05)" }}
                      />
                      {builds.map((j, i) => (
                        <Bar
                          key={j.id}
                          dataKey={j.shortName}
                          fill={COLORS[i % COLORS.length]}
                          radius={[3, 3, 0, 0]}
                          name={j.shortName}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          <div className="grid-2">
            {builds.map((job) => {
              const drawn =
                job.loanAmount > 0 ? pct(job.drawnToDate, job.loanAmount) : 0;
              const draws = job.draws || [];
              const currentDraw = draws[draws.length - 1];
              return (
                <PropertyCard
                  key={job.id}
                  onClick={() => onSelectBuild(job.id)}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="text-lg font-bold text-ink emboss tracking-tight">
                        {job.name}
                      </div>
                      <div className="mt-1 text-[11px] font-mono text-label">
                        {job.address}
                      </div>
                    </div>
                    <Badge label={job.type} />
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <Stamp className="text-[9px]">Loan utilized</Stamp>
                      <Mono className="text-[11px] text-label">
                        {drawn}% · {fc(job.drawnToDate)} of {fc(job.loanAmount)}
                      </Mono>
                    </div>
                    <ProgressBar
                      value={job.drawnToDate}
                      max={job.loanAmount || 1}
                      color="#ff4757"
                      height={6}
                    />
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between mb-2">
                      <Stamp className="text-[9px]">
                        Construction complete
                      </Stamp>
                      <Mono className="text-[11px] text-label">
                        {job.completion}%
                      </Mono>
                    </div>
                    <ProgressBar
                      value={job.completion}
                      max={100}
                      color="#3b82f6"
                      height={4}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat
                      label="Current Draw"
                      value={currentDraw ? `#${currentDraw.num}` : "—"}
                      sub={
                        currentDraw ? (
                          <StatusDot status={currentDraw.status} />
                        ) : (
                          "No draws"
                        )
                      }
                    />
                    <MiniStat
                      label="Draw Total"
                      value={currentDraw ? fc(currentDraw.amount) : "$0"}
                      sub={currentDraw ? `${currentDraw.invoices} invoices` : ""}
                    />
                    <MiniStat
                      label="Available"
                      value={fc(job.loanAmount - job.drawnToDate)}
                      sub="remaining"
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.1em] text-label">
                    <span>
                      {job.startDate ? `Started ${job.startDate}` : ""}
                    </span>
                    <span className="flex items-center gap-1.5 group-hover:text-accent transition-colors">
                      {job.estCompletion && `Est. ${job.estCompletion}`}
                      <ArrowRight
                        className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                        strokeWidth={2}
                      />
                    </span>
                  </div>
                </PropertyCard>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
