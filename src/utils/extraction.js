// Invoice extraction — calls server-side /api/extract endpoint.
// Small files go as base64 JSON; larger files are uploaded to Supabase Storage
// first (Vercel's request body is capped ~4.5 MB).

import { authFetch, supabase } from "./supabase";
import { mapTrade } from "./tradeMap";

const STORAGE_BUCKET = "invoice-uploads";
const DIRECT_UPLOAD_THRESHOLD = 3 * 1024 * 1024; // 3 MB

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isZipFile(file) {
  return (
    file.name.toLowerCase().endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed"
  );
}

async function uploadToStorage(file) {
  const rand = Math.random().toString(36).slice(2, 10);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}-${rand}/${safeName}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

async function postExtract(body) {
  const res = await authFetch("/api/extract", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Extraction failed (${res.status})`);
  }
  return res.json();
}

export async function extractInvoices(file) {
  const zip = isZipFile(file);

  let response;
  if (file.size > DIRECT_UPLOAD_THRESHOLD) {
    const storagePath = await uploadToStorage(file);
    response = await postExtract({
      storagePath,
      kind: zip ? "zip" : "pdf",
    });
  } else {
    const base64 = await fileToBase64(file);
    response = await postExtract(zip ? { zip: base64 } : { pdf: base64 });
  }

  const { invoices, meta } = response;
  const normalized = invoices.map((inv) => ({
    ...inv,
    tradeCategory: mapTrade(inv.tradeCategory),
  }));
  return { invoices: normalized, meta };
}

export async function uploadForLjld(file) {
  if (file.size > DIRECT_UPLOAD_THRESHOLD) {
    const storagePath = await uploadToStorage(file);
    return {
      body: { storagePath, kind: isZipFile(file) ? "zip" : "pdf" },
    };
  }
  const base64 = await fileToBase64(file);
  return {
    body: isZipFile(file) ? { zip: base64 } : { pdf: base64 },
  };
}
