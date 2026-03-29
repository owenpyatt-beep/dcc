import React, { useState } from "react";
import { T, DRAW_STATUS } from "../data/jobs";
import { fc, Mono, StatusDot } from "../utils/format";
import { useJobs } from "../context/JobsContext";

export default function DrawsView() {
  const { jobs, addDraw } = useJobs();
  const [selectedJob, setSelectedJob] = useState(jobs[0]?.id);
  const job = jobs.find((j) => j.id === selectedJob) || jobs[0];
  const stages = ["compiling", "in_review", "submitted", "funded"];
  const stageLabels = {
    compiling: "Compiling",
    in_review: "In Review",
    submitted: "Submitted",
    funded: "Funded",
  };

  if (!job) return null;

  return (
    <div>
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
          alignItems: "center",
        }}
      >
        {jobs.map((j) => (
          <button
            key={j.id}
            onClick={() => setSelectedJob(j.id)}
            style={{
              background:
                selectedJob === j.id ? T.bg4 : "transparent",
              border:
                selectedJob === j.id
                  ? `1px solid ${T.border}`
                  : "1px solid transparent",
              color: selectedJob === j.id ? T.text0 : T.text2,
              fontSize: 12,
              fontWeight: 600,
              padding: "7px 18px",
              borderRadius: 7,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {j.shortName}
          </button>
        ))}
        <button
          onClick={() => addDraw(job.id)}
          style={{
            background: T.goldDim,
            border: `1px solid ${T.goldBorder}`,
            borderRadius: 7,
            color: T.gold,
            fontSize: 11,
            fontWeight: 600,
            padding: "6px 14px",
            cursor: "pointer",
            marginLeft: 8,
            fontFamily: "inherit",
          }}
        >
          + New Draw
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {stages.map((stage) => {
          const draws = job.draws.filter((d) => d.status === stage);
          const ds = DRAW_STATUS[stage];
          return (
            <div
              key={stage}
              style={{
                background: T.bg2,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${T.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: ds.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: ds.color,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                    }}
                  >
                    {stageLabels[stage]}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: T.text2 }}>
                  {draws.length}
                </span>
              </div>
              <div style={{ padding: 12, minHeight: 80 }}>
                {draws.map((d) => (
                  <div
                    key={d.num}
                    style={{
                      background: T.bg3,
                      borderRadius: 8,
                      padding: "12px 14px",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: T.text0,
                        marginBottom: 6,
                      }}
                    >
                      Draw #{d.num}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 14,
                        color: ds.color,
                        fontWeight: 700,
                      }}
                    >
                      {fc(d.amount)}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: T.text2,
                        marginTop: 4,
                      }}
                    >
                      {d.invoices} invoices
                    </div>
                    {d.submitted && (
                      <div
                        style={{
                          fontSize: 10,
                          color: T.text2,
                          marginTop: 2,
                        }}
                      >
                        Sub: {d.submitted}
                      </div>
                    )}
                    {d.funded && (
                      <div
                        style={{
                          fontSize: 10,
                          color: T.green,
                          marginTop: 2,
                        }}
                      >
                        Funded: {d.funded}
                      </div>
                    )}
                    {d.accuracy && (
                      <div
                        style={{
                          fontSize: 10,
                          color: T.text2,
                          marginTop: 2,
                        }}
                      >
                        Accuracy:{" "}
                        <span style={{ color: T.green }}>
                          {d.accuracy}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {draws.length === 0 && (
                  <div
                    style={{
                      height: 60,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: T.text3,
                    }}
                  >
                    —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: T.bg2,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: T.text2,
            }}
          >
            Draw History — {job.name}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: T.text2,
            }}
          >
            {fc(job.draws.reduce((s, d) => s + d.amount, 0))} total &middot;{" "}
            {job.draws.length} draws
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {[
                "Draw",
                "Amount",
                "Invoices",
                "Accuracy",
                "Submitted",
                "Funded",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 24px",
                    textAlign: "left",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: T.text3,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {job.draws.map((d, i) => (
              <tr
                key={d.num}
                style={{
                  borderBottom:
                    i < job.draws.length - 1
                      ? `1px solid ${T.bg3}`
                      : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.bg3)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td
                  style={{
                    padding: "13px 24px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: T.text0,
                  }}
                >
                  #{d.num}
                </td>
                <td style={{ padding: "13px 24px" }}>
                  <Mono style={{ fontSize: 13, color: T.gold }}>
                    {fc(d.amount)}
                  </Mono>
                </td>
                <td
                  style={{
                    padding: "13px 24px",
                    fontSize: 12,
                    color: T.text1,
                  }}
                >
                  {d.invoices}
                </td>
                <td style={{ padding: "13px 24px" }}>
                  {d.accuracy ? (
                    <Mono
                      style={{
                        fontSize: 12,
                        color:
                          d.accuracy > 99.5 ? T.green : T.amber,
                      }}
                    >
                      {d.accuracy}%
                    </Mono>
                  ) : (
                    <span style={{ color: T.text3 }}>—</span>
                  )}
                </td>
                <td
                  style={{
                    padding: "13px 24px",
                    fontSize: 12,
                    color: T.text1,
                  }}
                >
                  {d.submitted || (
                    <span style={{ color: T.text3 }}>—</span>
                  )}
                </td>
                <td
                  style={{
                    padding: "13px 24px",
                    fontSize: 12,
                    color: d.funded ? T.green : T.text3,
                  }}
                >
                  {d.funded || "—"}
                </td>
                <td style={{ padding: "13px 24px" }}>
                  <StatusDot status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            padding: "12px 24px",
            borderTop: `1px solid ${T.border}`,
            background: T.bg3,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 11, color: T.text2 }}>
            Cumulative drawn
          </span>
          <Mono style={{ fontSize: 12, color: T.gold }}>
            {fc(job.drawnToDate)} of {fc(job.loanAmount)}
          </Mono>
        </div>
      </div>
    </div>
  );
}
