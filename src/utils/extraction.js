const EXTRACTION_PROMPT =
  "Extract every invoice from this PDF. Return a JSON array only, no other text. " +
  "Each item: { vendor, invoiceNumber, invoiceDate, amountDue, jobName, tradeCategory }. " +
  "For pay applications, use the current payment due amount not the contract total.";

export async function extractInvoices(base64Pdf) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf,
              },
            },
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const text = data.content[0].text;

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array found in response");

  return JSON.parse(jsonMatch[0]).map((inv, i) => ({
    id: i,
    vendor: inv.vendor || "",
    invoiceNumber: inv.invoiceNumber || "",
    invoiceDate: inv.invoiceDate || "",
    amountDue: typeof inv.amountDue === "number" ? inv.amountDue : parseFloat(String(inv.amountDue).replace(/[^0-9.-]/g, "")) || 0,
    jobName: inv.jobName || "",
    tradeCategory: inv.tradeCategory || "Other",
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
