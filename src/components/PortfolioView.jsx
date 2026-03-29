import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { T } from "../data/jobs";
import { fc, pct, short, Mono, Badge, StatusDot, ProgressBar, KpiCard, ChartTip, COLORS } from "../utils/format";
import { useJobs } from "../context/JobsContext";

const BAR_COLORS = [T.gold, T.blue, T.green, T.amber, "#a680d4"];

export default function PortfolioView({ onSelectJob }) {
  const { jobs } = useJobs();

  const totalLoan = jobs.reduce((s, j) => s + j.loanAmount, 0);
  const totalDrawn = jobs.reduce((s, j) => s + j.drawnToDate, 0);
  const totalPending = jobs.reduce(
    (s, j) =>
      s +
      j.draws
        .filter((d) => d.status !== "funded")
        .reduce((ss, d) => ss + d.amount, 0),
    0
  );
  const totalFunded = jobs.reduce(
    (s, j) =>
      s +
      j.draws
        .filter((d) => d.status === "funded")
        .reduce((ss, d) => ss + d.amount, 0),
    0
  );
  const loanData = jobs.map((j) => ({
    name: j.shortName,
    Drawn: j.drawnToDate,
    Pending:
      j.draws
        .filter((d) => d.status !== "funded")
        .reduce((ss, d) => ss + d.amount, 0),
    Available:
      j.loanAmount -
      j.drawnToDate -
      j.draws
        .filter((d) => d.status !== "funded")
        .reduce((ss, d) => ss + d.amount, 0),
  }));

  const combinedCashflow = (() => {
    const allMonths = [];
    const seen = new Set();
    jobs.forEach((j) =>
      j.cashflow.forEach((r) => {
        if (!seen.has(r.month)) {
          seen.add(r.month);
          allMonths.push(r.month);
        }
      })
    );
    return allMonths.map((m) => {
      const row = { month: m };
      jobs.forEach((j) => {
        const entry = j.cashflow.find((r) => r.month === m);
        row[j.shortName] = entry ? entry.drawn : 0;
      });
      return row;
    });
  })();

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <KpiCard
          label="Total Loan Facility"
          value={short(totalLoan)}
          sub={`${jobs.length} active projects`}
          accent={T.gold}
        />
        <KpiCard
          label="Total Drawn"
          value={short(totalDrawn)}
          sub={totalLoan > 0 ? `${pct(totalDrawn, totalLoan)}% of facility utilized` : "No loans yet"}
          accent={T.blue}
        />
        <KpiCard
          label="Draws In-Flight"
          value={fc(totalPending)}
          sub="Awaiting title company"
          accent={T.amber}
        />
        <KpiCard
          label="Total Funded"
          value={short(totalFunded)}
          sub={`${jobs.reduce(
            (s, j) => s + j.draws.filter((d) => d.status === "funded").length,
            0
          )} draws settled`}
          accent={T.green}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            background: T.bg2,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: T.text2,
              marginBottom: 20,
            }}
          >
            Loan Utilization by Project
          </div>
          <ResponsiveContainer width="100%" height={Math.max(120, jobs.length * 60)}>
            <BarChart data={loanData} layout="vertical" barCategoryGap="35%">
              <CartesianGrid horizontal={false} stroke={T.bg4} />
              <XAxis
                type="number"
                tickFormatter={(v) => short(v)}
                tick={{ fill: T.text2, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: T.text1, fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                content={<ChartTip />}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="Drawn" stackId="a" fill={T.gold} name="Drawn" />
              <Bar dataKey="Pending" stackId="a" fill={T.amber} name="Pending" />
              <Bar
                dataKey="Available"
                stackId="a"
                fill={T.bg4}
                radius={[0, 3, 3, 0]}
                name="Available"
              />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
            {[
              ["Drawn", T.gold],
              ["Pending", T.amber],
              ["Available", T.bg4],
            ].map(([l, c]) => (
              <div
                key={l}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10,
                  color: T.text2,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: c,
                    border:
                      c === T.bg4 ? `1px solid ${T.border}` : "none",
                  }}
                />
                {l}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            background: T.bg2,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: T.text2,
              marginBottom: 20,
            }}
          >
            Draw Disbursements
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={combinedCashflow} barCategoryGap="25%">
              <CartesianGrid vertical={false} stroke={T.bg4} />
              <XAxis
                dataKey="month"
                tick={{ fill: T.text2, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) =>
                  v >= 1000 ? `${v / 1000}K` : v
                }
                tick={{ fill: T.text2, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTip />}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              {jobs.map((j, i) => (
                <Bar
                  key={j.id}
                  dataKey={j.shortName}
                  fill={BAR_COLORS[i % BAR_COLORS.length]}
                  radius={[2, 2, 0, 0]}
                  name={j.shortName}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: jobs.length === 1 ? "1fr" : "1fr 1fr",
          gap: 18,
        }}
      >
        {jobs.map((job) => {
          const drawn = job.loanAmount > 0 ? pct(job.drawnToDate, job.loanAmount) : 0;
          const currentDraw = job.draws[job.draws.length - 1];
          return (
            <div
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              style={{
                background: T.bg2,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "22px 24px",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = T.borderHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = T.border)
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 17,
                      fontWeight: 700,
                      color: T.text0,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {job.name}
                  </div>
                  <div
                    style={{ fontSize: 11, color: T.text2, marginTop: 3 }}
                  >
                    {job.address}
                  </div>
                </div>
                <Badge label={job.id} color={T.text2} bg={T.bg3} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: T.text2 }}>Loan utilized</span>
                  <Mono style={{ fontSize: 11, color: T.text1 }}>
                    {drawn}% &middot; {fc(job.drawnToDate)} of{" "}
                    {fc(job.loanAmount)}
                  </Mono>
                </div>
                <ProgressBar
                  value={job.drawnToDate}
                  max={job.loanAmount || 1}
                  color={T.gold}
                  height={5}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  marginBottom: 14,
                }}
              >
                <span style={{ color: T.text2 }}>
                  Construction complete
                </span>
                <Mono style={{ fontSize: 11, color: T.text1 }}>
                  {job.completion}%
                </Mono>
              </div>
              <ProgressBar
                value={job.completion}
                max={100}
                color={T.blue}
                height={3}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                {[
                  {
                    label: "Current Draw",
                    value: `#${currentDraw.num}`,
                    sub: <StatusDot status={currentDraw.status} />,
                  },
                  {
                    label: "Draw Total",
                    value: fc(currentDraw.amount),
                    sub: `${currentDraw.invoices} invoices`,
                  },
                  {
                    label: "Available",
                    value: fc(job.loanAmount - job.drawnToDate),
                    sub: "remaining",
                  },
                ].map((f) => (
                  <div
                    key={f.label}
                    style={{
                      background: T.bg3,
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.09em",
                        textTransform: "uppercase",
                        color: T.text2,
                        marginBottom: 6,
                      }}
                    >
                      {f.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: T.text0,
                      }}
                    >
                      {f.value}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: T.text2,
                        marginTop: 3,
                      }}
                    >
                      {f.sub}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 14,
                  fontSize: 11,
                  color: T.text2,
                }}
              >
                <span>{job.startDate ? `Started ${job.startDate}` : ""}</span>
                <span>{job.estCompletion ? `Est. ${job.estCompletion}` : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
