// LJLD interactive verification chat.
// Jenny types a question or clarification; Claude responds with guidance about
// the current line items. Items are passed each turn so the call is stateless.
//
// POST /api/ljld-chat  { items, message, history? }

import { verifyAuth } from "./_auth.js";

const SYSTEM = `You are a bookkeeping assistant helping Jenny assemble an LJLD LLC invoice from extracted pre-paid receipts and labor entries. Be concise (2-4 sentences typically). Reference line items by their id when relevant (e.g., "item #3 — Home Depot"). If the user confirms a value or asks you to update something, acknowledge what change they want to make but remind them to edit the row directly in the table (you do not have tool access to modify the data for them). If you see duplicates, math errors, or missing required fields, point them out.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });

  const { items, message, history } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items array required" });
  }
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message required" });
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: "Anthropic API key not configured" });
  }

  const itemsSnapshot = items.map((it, i) => ({
    id: it.id ?? i,
    type: it.type,
    vendor: it.vendor,
    description: it.description,
    invoice_date: it.invoice_date,
    line_invoice_number: it.line_invoice_number,
    amount: it.amount,
    flags: it.flags || [],
    source_file: it.source_file,
  }));

  const subtotal = items.reduce(
    (s, it) => s + (parseFloat(it.amount) || 0),
    0
  );

  const messages = [];
  if (Array.isArray(history)) {
    for (const h of history.slice(-10)) {
      if (h.role === "user" || h.role === "assistant") {
        messages.push({ role: h.role, content: String(h.content || "") });
      }
    }
  }
  messages.push({
    role: "user",
    content: `Current line items (${items.length}, subtotal $${subtotal.toFixed(2)}):\n${JSON.stringify(itemsSnapshot, null, 2)}\n\nJenny asks: ${message}`,
  });

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM,
        messages,
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Claude error ${aiRes.status}`);
    }

    const data = await aiRes.json();
    return res.status(200).json({ ok: true, reply: data.content[0].text });
  } catch (err) {
    console.error("LJLD chat error:", err);
    return res.status(500).json({ error: err.message });
  }
}
