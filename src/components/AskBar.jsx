import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { authFetch } from "../utils/supabase";
import { Button } from "./ui/Button";
import { LED } from "./ui/LED";
import { Stamp } from "./ui/Typography";

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
      const res = await authFetch("/api/ask", {
        method: "POST",
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
      <form onSubmit={handleAsk} className="flex items-stretch gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-label/70 pointer-events-none"
            strokeWidth={1.8}
          />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about vendors, draws, payments..."
            className="w-full rounded-xl bg-chassis pl-11 pr-4 h-12 text-sm font-mono text-ink placeholder:text-label/60 shadow-recessed border-none outline-none transition-shadow focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_var(--accent)]"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={loading || !question.trim()}
        >
          {loading ? "Searching..." : "Ask"}
        </Button>
      </form>

      {error && (
        <div className="mt-4 rounded-xl px-4 py-3 bg-chassis shadow-recessed-sm flex items-center gap-3">
          <LED color="red" size={9} pulse />
          <span className="font-mono text-xs text-[#b91c1c]">
            ERROR — {error}
          </span>
        </div>
      )}

      {answer && (
        <div className="mt-4 rounded-2xl bg-chassis p-6 shadow-card relative">
          <div className="flex items-center gap-2 mb-3">
            <LED color="green" size={8} pulse />
            <Stamp>Response</Stamp>
          </div>
          <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {answer}
          </div>
          {meta && (
            <div className="mt-4 pt-3 border-t border-[rgba(74,85,104,0.1)] flex flex-wrap gap-4">
              <Stamp className="text-[9px]">
                {meta.transactionsSearched} txns
              </Stamp>
              <Stamp className="text-[9px]">
                {meta.vendorsFound} vendors
              </Stamp>
              <Stamp className="text-[9px]">
                {meta.propertiesSearched} properties
              </Stamp>
            </div>
          )}
          <button
            onClick={() => {
              setAnswer(null);
              setMeta(null);
              setQuestion("");
            }}
            className="press absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-label hover:text-ink shadow-card"
            aria-label="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
