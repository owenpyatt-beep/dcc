import React, { useState } from "react";
import { T } from "../data/jobs";
import { useAuth } from "../context/AuthContext";

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
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: T.bg0,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <form onSubmit={handleSubmit} style={{
        background: T.bg2,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "40px 36px 32px",
        width: 380,
        maxWidth: "100%",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: `linear-gradient(135deg, ${T.gold}, #9e7a3a)`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: T.bg0, marginBottom: 14,
          }}>
            D
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20, fontWeight: 700, color: T.text0,
          }}>
            Debrecht Command Center
          </div>
          <div style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>
            Sign in to continue
          </div>
        </div>

        {error && (
          <div style={{
            background: T.redDim, border: `1px solid ${T.red}44`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 18,
            fontSize: 12, color: T.red,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: T.text2, marginBottom: 6,
          }}>
            Email
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%", background: T.bg3, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.text0, fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, padding: "11px 14px", outline: "none",
            }}
            placeholder="you@example.com"
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: T.text2, marginBottom: 6,
          }}>
            Password
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%", background: T.bg3, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.text0, fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, padding: "11px 14px", outline: "none",
            }}
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", background: T.goldDim, border: `1px solid ${T.goldBorder}`,
            borderRadius: 8, color: T.gold, fontSize: 14, fontWeight: 600,
            padding: "12px 0", cursor: loading ? "wait" : "pointer",
            fontFamily: "inherit", opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
