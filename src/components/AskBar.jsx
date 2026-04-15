import React, { useState } from "react";
import { T } from "../data/jobs";
import { Mono } from "../utils/format";

export default function AskBar() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setMeta(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setAnswer(data.answer);
        setMeta(data.meta);
      } else {
        setError(data.error || "Failed to get answer");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleAsk} style={{ display: "flex", gap: 8, marginBottom: answer || error ? 16 : 0 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="7" stroke={T.text3} strokeWidth="1.5" />
            <path d="M16 16l4.5 4.5" stroke={T.text3} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about vendors, draws, payments..."
            style={{
              width: "100%",
              background: T.bg2,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.text0,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              padding: "10px 14px 10px 36px",
              outline: "none",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !question.trim()}
          style={{
            background: T.goldDim,
            border: `1px solid ${T.goldBorder}`,
            borderRadius: 8,
            color: T.gold,
            fontSize: 12,
            fontWeight: 600,
            padding: "0 18px",
            cursor: loading ? "wait" : "pointer",
            fontFamily: "inherit",
            opacity: loading || !question.trim() ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Searching..." : "Ask"}
        </button>
      </form>

      {error && (
        <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "12px 16px", fontSize: 12, color: T.red }}>
          {error}
        </div>
      )}

      {answer && (
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 22px" }}>
          <div style={{ fontSize: 13, color: T.text0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{answer}</div>
          {meta && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 16, fontSize: 10, color: T.text3 }}>
              <span>Searched {meta.transactionsSearched} transactions</span>
              <span>{meta.vendorsFound} vendors</span>
              <span>{meta.propertiesSearched} properties</span>
            </div>
          )}
          <button
            onClick={() => { setAnswer(null); setMeta(null); setQuestion(""); }}
            style={{ marginTop: 10, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, color: T.text2, fontSize: 11, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
