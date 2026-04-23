// Generates a finalized LJLD LLC invoice as an .xlsx using the template at
// api/templates/ljld-invoice.xlsx. Also writes an aggregate row into the
// invoices table tagged as vendor "LJLD LLC" so it flows into draws.
//
// POST /api/ljld-generate  { ljldInvoiceId }
// Returns the xlsx as a binary attachment.

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";
import { supabaseAdmin } from "./_supabase.js";
import { verifyAuth } from "./_auth.js";

// Resolve the template path from several candidate locations so we work under
// both local dev (`__dirname`-relative) and Vercel's bundled runtime (where
// includeFiles puts the file under the function's working directory).
function resolveTemplatePath() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, "templates", "ljld-invoice.xlsx"),
    path.join(process.cwd(), "api", "templates", "ljld-invoice.xlsx"),
    path.join(process.cwd(), "templates", "ljld-invoice.xlsx"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `Template not found. Tried: ${candidates.join(" | ")}`
  );
}

// How many line-item rows exist in the template (B10:D28 → rows 11-28).
const MAX_TEMPLATE_ROWS = 18;
const LINE_START_ROW = 11;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });

  const { ljldInvoiceId } = req.body;
  if (!ljldInvoiceId) {
    return res.status(400).json({ error: "ljldInvoiceId required" });
  }

  try {
    const [invRes, itemsRes] = await Promise.all([
      supabaseAdmin
        .from("ljld_invoices")
        .select("*")
        .eq("id", ljldInvoiceId)
        .single(),
      supabaseAdmin
        .from("ljld_line_items")
        .select("*")
        .eq("ljld_invoice_id", ljldInvoiceId)
        .order("position"),
    ]);

    if (invRes.error) throw invRes.error;
    if (itemsRes.error) throw itemsRes.error;

    const ljldInvoice = invRes.data;
    const items = itemsRes.data || [];

    const { data: property, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("*")
      .eq("id", ljldInvoice.property_id)
      .single();
    if (propErr) throw propErr;

    const subtotal = items.reduce(
      (s, it) => s + (parseFloat(it.amount) || 0),
      0
    );
    const taxRate = parseFloat(ljldInvoice.tax_rate) || 0;
    const other = parseFloat(ljldInvoice.other) || 0;
    const total = subtotal * (1 + taxRate) + other;

    // Load the template — read as buffer so the underlying path lookup is
    // explicit, and we fail with a useful error if the file isn't bundled.
    const templatePath = resolveTemplatePath();
    const templateBuffer = fs.readFileSync(templatePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(templateBuffer);
    const sheet = workbook.worksheets[0];

    // Header fields
    if (ljldInvoice.invoice_number) {
      sheet.getCell("C1").value = ljldInvoice.invoice_number;
    }
    if (ljldInvoice.invoice_date) {
      sheet.getCell("C5").value = ljldInvoice.invoice_date;
    }
    sheet.getCell("B7").value = property.name || "";
    sheet.getCell("B8").value = property.address || "";

    // Line items — rows 11..(11+N-1), up to MAX_TEMPLATE_ROWS
    const usable = items.slice(0, MAX_TEMPLATE_ROWS);
    for (let i = 0; i < usable.length; i++) {
      const item = usable[i];
      const row = LINE_START_ROW + i;
      const details = item.description
        ? item.type === "labor"
          ? `${item.description} (Labor)`
          : item.vendor
          ? `${item.vendor} — ${item.description}`
          : item.description
        : item.vendor || "";
      sheet.getCell(`B${row}`).value = details;
      sheet.getCell(`C${row}`).value = item.line_invoice_number || "";
      sheet.getCell(`D${row}`).value = parseFloat(item.amount) || 0;
    }
    // Clear any remaining template rows
    for (let i = usable.length; i < MAX_TEMPLATE_ROWS; i++) {
      const row = LINE_START_ROW + i;
      sheet.getCell(`B${row}`).value = null;
      sheet.getCell(`C${row}`).value = null;
      sheet.getCell(`D${row}`).value = null;
    }

    // Tax rate + other. The template formulas compute subtotal and total from
    // these cells; setting numeric values here keeps the formulas intact.
    sheet.getCell("D30").value = taxRate;
    sheet.getCell("D31").value = other;

    // Persist totals + mark finalized if not already
    const finalizedPatch = {
      subtotal,
      total,
      status: "finalized",
      updated_at: new Date().toISOString(),
    };

    // Create or update the aggregate invoices row (vendor = LJLD LLC)
    let aggregateInvoiceId = ljldInvoice.aggregate_invoice_id;
    const aggregateRow = {
      property_id: ljldInvoice.property_id,
      draw_id: ljldInvoice.draw_id,
      vendor: "LJLD LLC",
      invoice_number: ljldInvoice.invoice_number || `LJLD-${ljldInvoiceId.slice(0, 8)}`,
      invoice_date: ljldInvoice.invoice_date || null,
      amount_due: total,
      job_name: property.name || "",
      trade_category: "General Construction",
      invoice_type: "standard",
      missing_data_flag: null,
    };
    if (aggregateInvoiceId) {
      const { error } = await supabaseAdmin
        .from("invoices")
        .update(aggregateRow)
        .eq("id", aggregateInvoiceId);
      if (error) throw error;
    } else {
      const { data, error } = await supabaseAdmin
        .from("invoices")
        .insert(aggregateRow)
        .select()
        .single();
      if (error) throw error;
      aggregateInvoiceId = data.id;
      finalizedPatch.aggregate_invoice_id = aggregateInvoiceId;
    }

    const { error: updErr } = await supabaseAdmin
      .from("ljld_invoices")
      .update(finalizedPatch)
      .eq("id", ljldInvoiceId);
    if (updErr) throw updErr;

    // If attached to a draw, recompute that draw's amount/invoice_count from
    // the invoices table so the aggregate gets counted.
    if (ljldInvoice.draw_id) {
      const { data: drawInvs } = await supabaseAdmin
        .from("invoices")
        .select("amount_due")
        .eq("draw_id", ljldInvoice.draw_id);
      const sum = (drawInvs || []).reduce(
        (s, r) => s + (parseFloat(r.amount_due) || 0),
        0
      );
      await supabaseAdmin
        .from("draws")
        .update({ amount: sum, invoice_count: (drawInvs || []).length })
        .eq("id", ljldInvoice.draw_id);
    }

    const buf = await workbook.xlsx.writeBuffer();

    const safeProp = (property.shortName || property.name || "Property")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "");
    const filename = `LJLD_${safeProp}_${
      ljldInvoice.invoice_number || ljldInvoiceId.slice(0, 8)
    }.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("X-Ljld-Total", total.toFixed(2));
    res.setHeader("X-Ljld-Aggregate-Invoice-Id", aggregateInvoiceId);
    return res.status(200).send(Buffer.from(buf));
  } catch (err) {
    console.error("LJLD generate error:", err);
    return res.status(500).json({ error: err.message || "Generation failed" });
  }
}
