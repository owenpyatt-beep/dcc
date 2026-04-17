// Server-side invoice extraction via Anthropic API
// POST /api/extract  { pdf: "base64-encoded-pdf-data" }
//
// Moves the Anthropic API call server-side so the API key
// never touches the browser.

import { verifyAuth } from "./_auth.js";

const EXTRACTION_PROMPT = `You are a construction draw invoice extraction system for Debrecht Properties. Extract every invoice from this PDF with extreme precision.

## INVOICE TYPE CLASSIFICATION

### Type A: Standard Invoice
Single transaction, one total. Extract the Invoice Total or Balance Due.

### Type B: Pay Application (Progress Billing)
EXTRACT: "Current Payment Due" — NOT the contract total, NOT completed-to-date.

### Type C: Account Statement (Multiple Invoices)
Parse EACH line item as a separate row.

## TRADE CATEGORIES
General Construction, HVAC, Electrical, Plumbing, Sitework / Grading, Framing, Drywall, Flooring, Cabinets / Millwork, Roofing, Windows / Doors, Landscaping, Permits / Fees, Engineering / Architecture, Miscellaneous

## OUTPUT FORMAT
Return a JSON array ONLY. Each item:
{
  "vendor": "Full legal vendor name",
  "invoiceNumber": "Exact string from document",
  "invoiceDate": "MM/DD/YYYY",
  "amountDue": 1234.56,
  "jobName": "property name or address",
  "tradeCategory": "One of the categories above",
  "invoiceType": "standard" | "pay_application" | "statement_line",
  "missingDataFlag": null or "description of issue"
}

For pay applications: amountDue MUST be Current Payment Due, not the contract total.
For statements: one row per line item, not the statement total.
amountDue must be a number (no $ sign, no commas).`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST required" });
  }

  // Verify auth
  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { pdf } = req.body;
  if (!pdf) {
    return res.status(400).json({ error: "pdf (base64) is required" });
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: "Anthropic API key not configured" });
  }

  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: pdf },
              },
              { type: "text", text: EXTRACTION_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${apiRes.status}`);
    }

    const data = await apiRes.json();
    const text = data.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");

    const invoices = JSON.parse(jsonMatch[0]).map((inv, i) => ({
      id: i,
      vendor: inv.vendor || "",
      invoiceNumber: inv.invoiceNumber || "",
      invoiceDate: inv.invoiceDate || "",
      amountDue: typeof inv.amountDue === "number" ? inv.amountDue : parseFloat(String(inv.amountDue).replace(/[^0-9.-]/g, "")) || 0,
      jobName: inv.jobName || "",
      tradeCategory: inv.tradeCategory || "General Construction",
      invoiceType: inv.invoiceType || "standard",
      missingDataFlag: inv.missingDataFlag || null,
    }));

    return res.status(200).json({ ok: true, invoices });
  } catch (err) {
    console.error("Extraction error:", err);
    return res.status(500).json({ error: "Extraction failed" });
  }
}
