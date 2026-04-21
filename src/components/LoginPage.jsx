import React, { useState } from "react";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Panel } from "./ui/Panel";
import { Input, Label } from "./ui/Input";
import { Button } from "./ui/Button";
import { LED, StatusPill } from "./ui/LED";
import { Stamp } from "./ui/Typography";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-chassis relative overflow-hidden">
      {/* subtle radial highlight to hint at the top-left light source */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.55) 0%, transparent 55%)",
        }}
      />

      <Panel
        screws
        elevated
        className="w-full max-w-md px-10 pt-10 pb-8 bg-chassis"
      >
        {/* Header plate */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {/* "D" badge — embossed accent chip */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl font-extrabold text-white text-lg"
              style={{
                background:
                  "linear-gradient(135deg, #ff4757 0%, #c1323e 100%)",
                boxShadow:
                  "4px 4px 10px rgba(166,50,60,0.45), -3px -3px 8px rgba(255,120,130,0.35), inset 1px 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              D
            </div>
            <div>
              <div className="text-[15px] font-bold text-ink emboss leading-tight">
                Debrecht
              </div>
              <Stamp className="text-[9px]">Command Center</Stamp>
            </div>
          </div>
          <StatusPill color="green" label="Online" />
        </div>

        {/* "Screen" subtitle strip */}
        <div
          className="mb-8 rounded-lg px-4 py-3 bg-[#1a1f23] scanlines text-center relative overflow-hidden"
          style={{
            boxShadow:
              "inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 4px rgba(255,255,255,0.05)",
          }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7ed492] emboss-dark">
            &gt; authentication required
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-xs font-mono"
              style={{
                background: "rgba(239,68,68,0.08)",
                color: "#b91c1c",
                boxShadow:
                  "inset 2px 2px 4px rgba(239,68,68,0.2), inset -2px -2px 4px rgba(255,255,255,0.6)",
              }}
            >
              <span className="flex items-center gap-2">
                <LED color="red" size={8} pulse />
                ERROR — {error}
              </span>
            </div>
          )}

          <div>
            <Label>
              <Mail className="inline h-3 w-3 mr-1 -mt-0.5" />
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <Label>
              <Lock className="inline h-3 w-3 mr-1 -mt-0.5" />
              Password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full mt-2"
            iconRight={!loading && <ArrowRight className="h-4 w-4" />}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>

        {/* Footer plate */}
        <div className="mt-8 pt-5 border-t border-[rgba(74,85,104,0.1)] flex items-center justify-between">
          <Stamp>Secure · Supabase Auth</Stamp>
          <Stamp className="text-label/70">v1.0</Stamp>
        </div>
      </Panel>
    </div>
  );
}
