// Invoice extraction — calls server-side /api/extract endpoint
// The Anthropic API key never touches the browser.

import { authFetch } from "./supabase";
import { mapTrade } from "./tradeMap";

export async function extractInvoices(base64Pdf) {
  const res = await authFetch("/api/extract", {
    method: "POST",
    body: JSON.stringify({ pdf: base64Pdf }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Extraction failed (${res.status})`);
  }

  const { invoices } = await res.json();
  return invoices.map((inv) => ({
    ...inv,
    tradeCategory: mapTrade(inv.tradeCategory),
  }));
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
