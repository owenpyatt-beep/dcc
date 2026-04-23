// LJLD LLC extraction — takes a ZIP (or single PDF/image) of pre-paid receipts
// and labor sheets and runs them through Claude to pull line items. Also
// returns a review pass where Claude flags things Jenny should verify.
//
// POST /api/ljld-extract
//   { zip: base64 }   — multi-file ZIP (small)
//   { pdf: base64 }   — single document fallback
//   { storagePath, kind } — Supabase Storage path for larger uploads

import JSZip from "jszip";
import { verifyAuth } from "./_auth.js";
import { supabaseAdmin } from "./_supabase.js";

const STORAGE_BUCKET = "invoice-uploads";

const EXTRACTION_PROMPT = `You are extracting a single expense document for LJLD LLC, Debrecht's internal GC arm.

Classify the document as:
- "prepaid" — a receipt or invoice where LJLD paid a third-party vendor out of pocket (Home Depot, Lowe's, a subcontractor, etc.) and now needs to be reimbursed via a draw.
- "labor" — a labor / time / effort sheet where LJLD is billing the job for internal work performed.

Return a JSON array (one item per distinct line — statements may have multiple). Each item:
{
  "type": "prepaid" | "labor",
  "description": "Short human-readable description of what was purchased or work performed",
  "vendor": "Store or subcontractor name for prepaids; null for labor",
  "line_invoice_number": "Receipt/invoice number from the vendor for prepaids; null for labor",
  "invoice_date": "MM/DD/YYYY date on the document",
  "amount": 1234.56,
  "flags": ["list", "of", "concerns"]
}

Flags are short strings you add when something is uncertain. Examples: "amount_unclear", "date_unreadable", "vendor_missing", "multiple_totals_ambiguous", "possible_duplicate_line".

amount must be a number — no $ sign, no commas. If the document has multiple line items that each need to be billed separately, emit one JSON object per line. Otherwise emit one object for the whole document.

Return ONLY the JSON array.`;

const REVIEW_PROMPT = `You are a careful bookkeeping assistant reviewing extracted line items for LJLD LLC before they are added to a billable invoice.

For each item that has any concerns (flags, suspicious amounts, missing fields, possible duplicates across items, unusual descriptions), produce ONE plain-English question the user should answer. Keep each question under 120 characters and reference the item so the user can find it.

Return a JSON array:
[{ "item_id": 3, "question": "Home Depot $412.88 on 4/12 — can you confirm the amount? The last digit looked smudged." }]

Return an empty array if nothing needs review. Return ONLY the JSON.`;

async function callClaude(anthropicKey, body) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude error ${res.status}`);
  }
  return res.json();
}

function parseJsonArray(text) {
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    return JSON.parse(m[0]);
  } catch {
    return [];
  }
}

function mediaTypeFor(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return { kind: "document", mime: "application/pdf" };
  if (lower.endsWith(".png")) return { kind: "image", mime: "image/png" };
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg"))
    return { kind: "image", mime: "image/jpeg" };
  if (lower.endsWith(".webp")) return { kind: "image", mime: "image/webp" };
  if (lower.endsWith(".gif")) return { kind: "image", mime: "image/gif" };
  return null;
}

async function extractFile({ name, base64, mime, kind }, anthropicKey) {
  const content = [
    kind === "document"
      ? { type: "document", source: { type: "base64", media_type: mime, data: base64 } }
      : { type: "image", source: { type: "base64", media_type: mime, data: base64 } },
    { type: "text", text: EXTRACTION_PROMPT },
  ];
  const data = await callClaude(anthropicKey, {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content }],
  });
  const items = parseJsonArray(data.content[0].text);
  return items.map((it) => ({
    type: it.type === "labor" ? "labor" : "prepaid",
    description: it.description || "",
    vendor: it.vendor || null,
    line_invoice_number: it.line_invoice_number || null,
    invoice_date: it.invoice_date || "",
    amount:
      typeof it.amount === "number"
        ? it.amount
        : parseFloat(String(it.amount || "").replace(/[^0-9.-]/g, "")) || 0,
    source_file: name,
    flags: Array.isArray(it.flags) ? it.flags : [],
  }));
}

async function reviewItems(items, anthropicKey) {
  if (items.length === 0) return [];
  const summary = items.map((it, i) => ({
    item_id: i,
    type: it.type,
    vendor: it.vendor,
    description: it.description,
    amount: it.amount,
    invoice_date: it.invoice_date,
    flags: it.flags,
    source_file: it.source_file,
  }));
  const data = await callClaude(anthropicKey, {
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: REVIEW_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extracted items:\n${JSON.stringify(summary, null, 2)}`,
      },
    ],
  });
  return parseJsonArray(data.content[0].text);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });

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
    const files = [];
    let zipBuffer = null;
    let singleFileBase64 = null;
    let singleFileName = "upload.pdf";
    let singleFileKind = "document";
    let singleFileMime = "application/pdf";

    if (storagePath) {
      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .download(storagePath);
      if (error) throw new Error(`Storage download failed: ${error.message}`);
      const buf = Buffer.from(await data.arrayBuffer());
      const lower = storagePath.toLowerCase();
      if (kind === "zip" || lower.endsWith(".zip")) {
        zipBuffer = buf;
      } else {
        const mt = mediaTypeFor(lower);
        if (!mt) throw new Error("Unsupported file type in storage upload");
        singleFileBase64 = buf.toString("base64");
        singleFileName = storagePath.split("/").pop() || "upload";
        singleFileKind = mt.kind;
        singleFileMime = mt.mime;
      }
    } else if (zip) {
      zipBuffer = Buffer.from(zip, "base64");
    } else {
      singleFileBase64 = pdf;
    }

    if (zipBuffer) {
      const archive = await JSZip.loadAsync(zipBuffer);
      const entries = [];
      archive.forEach((relPath, entry) => {
        if (entry.dir) return;
        const lower = relPath.toLowerCase();
        if (lower.startsWith("__macosx/")) return;
        const mt = mediaTypeFor(lower);
        if (!mt) return;
        entries.push({ relPath, entry, ...mt });
      });
      if (entries.length === 0) {
        return res.status(400).json({
          error: "ZIP contains no PDF or image files (PDF/PNG/JPG/WEBP/GIF)",
        });
      }
      for (const e of entries) {
        const data = await e.entry.async("base64");
        files.push({ name: e.relPath, base64: data, mime: e.mime, kind: e.kind });
      }
    } else {
      files.push({
        name: singleFileName,
        base64: singleFileBase64,
        mime: singleFileMime,
        kind: singleFileKind,
      });
    }

    // Extract each file (concurrency-limited)
    const CONCURRENCY = 4;
    let cursor = 0;
    const buckets = new Array(files.length);
    const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, async () => {
      while (cursor < files.length) {
        const i = cursor++;
        try {
          buckets[i] = await extractFile(files[i], ANTHROPIC_KEY);
        } catch (err) {
          console.error(`LJLD extract failed on ${files[i].name}:`, err.message);
          buckets[i] = [];
        }
      }
    });
    await Promise.all(workers);

    const items = buckets
      .flat()
      .map((it, idx) => ({ ...it, id: idx, position: idx }));

    // One-shot Claude review to generate verification questions
    let issues = [];
    try {
      issues = await reviewItems(items, ANTHROPIC_KEY);
    } catch (err) {
      console.error("LJLD review pass failed:", err.message);
      // Fall back to flag-derived issues
      issues = items
        .filter((it) => it.flags.length > 0)
        .map((it) => ({
          item_id: it.id,
          question: `${it.vendor || it.description || "Item"}: please verify (${it.flags.join(", ")})`,
        }));
    }

    // Best-effort cleanup of the uploaded blob
    if (storagePath) {
      supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath])
        .catch((e) => console.warn("Storage cleanup failed:", e?.message));
    }

    return res.status(200).json({
      ok: true,
      items,
      issues,
      meta: { fileCount: files.length, sourceFiles: files.map((f) => f.name) },
    });
  } catch (err) {
    console.error("LJLD extraction error:", err);
    return res.status(500).json({ error: err.message || "Extraction failed" });
  }
}
