// Server-side invoice extraction via Anthropic API
// POST /api/extract
//   { pdf: "base64-encoded-pdf-data" }
//   { zip: "base64-encoded-zip-containing-pdfs" }
//   { storagePath: "path/in/invoice-uploads", kind: "pdf" | "zip" }
//
// Moves the Anthropic API call server-side so the API key
// never touches the browser. The storagePath form is used for larger
// uploads that would exceed Vercel's request body limit.

import JSZip from "jszip";
import { verifyAuth } from "./_auth.js";
import { supabaseAdmin } from "./_supabase.js";

const STORAGE_BUCKET = "invoice-uploads";

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

async function extractPdf(base64Pdf, anthropicKey) {
  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
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
              source: { type: "base64", media_type: "application/pdf", data: base64Pdf },
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

  return JSON.parse(jsonMatch[0]).map((inv) => ({
    vendor: inv.vendor || "",
    invoiceNumber: inv.invoiceNumber || "",
    invoiceDate: inv.invoiceDate || "",
    amountDue:
      typeof inv.amountDue === "number"
        ? inv.amountDue
        : parseFloat(String(inv.amountDue).replace(/[^0-9.-]/g, "")) || 0,
    jobName: inv.jobName || "",
    tradeCategory: inv.tradeCategory || "General Construction",
    invoiceType: inv.invoiceType || "standard",
    missingDataFlag: inv.missingDataFlag || null,
  }));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST required" });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { pdf, zip, storagePath, kind } = req.body;
  if (!pdf && !zip && !storagePath) {
    return res
      .status(400)
      .json({ error: "pdf, zip, or storagePath is required" });
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: "Anthropic API key not configured" });
  }

  try {
    let allInvoices = [];
    const sourceFiles = [];

    // Resolve the zip/pdf buffer from storage if a path was provided
    let zipBuffer = null;
    let pdfBase64 = null;
    if (storagePath) {
      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .download(storagePath);
      if (error) throw new Error(`Storage download failed: ${error.message}`);
      const buf = Buffer.from(await data.arrayBuffer());
      if (kind === "zip" || storagePath.toLowerCase().endsWith(".zip")) {
        zipBuffer = buf;
      } else {
        pdfBase64 = buf.toString("base64");
      }
    } else if (zip) {
      zipBuffer = Buffer.from(zip, "base64");
    } else {
      pdfBase64 = pdf;
    }

    if (zipBuffer) {
      const archive = await JSZip.loadAsync(zipBuffer);
      const pdfEntries = [];
      archive.forEach((relPath, entry) => {
        if (entry.dir) return;
        const lower = relPath.toLowerCase();
        if (lower.endsWith(".pdf") && !lower.startsWith("__macosx/")) {
          pdfEntries.push({ name: relPath, entry });
        }
      });

      if (pdfEntries.length === 0) {
        return res.status(400).json({ error: "ZIP contains no PDF files" });
      }

      // Extract each PDF in parallel with a soft concurrency cap
      const CONCURRENCY = 4;
      let cursor = 0;
      const results = new Array(pdfEntries.length);
      async function worker() {
        while (cursor < pdfEntries.length) {
          const i = cursor++;
          const { name, entry } = pdfEntries[i];
          try {
            const pdfB64 = await entry.async("base64");
            const invoices = await extractPdf(pdfB64, ANTHROPIC_KEY);
            results[i] = invoices.map((inv) => ({ ...inv, sourceFile: name }));
          } catch (err) {
            console.error(`Extract failed for ${name}:`, err.message);
            results[i] = [];
          }
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, pdfEntries.length) }, () =>
          worker()
        )
      );
      allInvoices = results.flat();
      for (const e of pdfEntries) sourceFiles.push(e.name);
    } else {
      allInvoices = await extractPdf(pdfBase64, ANTHROPIC_KEY);
    }

    const invoices = allInvoices.map((inv, i) => ({ id: i, ...inv }));

    // Best-effort cleanup of the uploaded blob (if any)
    if (storagePath) {
      supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath])
        .catch((e) => console.warn("Storage cleanup failed:", e?.message));
    }

    return res.status(200).json({
      ok: true,
      invoices,
      ...(sourceFiles.length
        ? { meta: { sourceFiles, fileCount: sourceFiles.length } }
        : {}),
    });
  } catch (err) {
    console.error("Extraction error:", err);
    return res.status(500).json({ error: err.message || "Extraction failed" });
  }
}
