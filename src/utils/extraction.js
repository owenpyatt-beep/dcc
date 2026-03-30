// Invoice extraction via Anthropic API
// Validated against 77 invoices, $1.47M, 99.76% accuracy (March 2026, The Legion)

const EXTRACTION_PROMPT = `You are a construction draw invoice extraction system for Debrecht Properties. Extract every invoice from this PDF with extreme precision.

## INVOICE TYPE CLASSIFICATION — Read carefully before extracting amounts

### Type A: Standard Invoice
Single transaction, one total. Extract the Invoice Total or Balance Due.

### Type B: Pay Application (Progress Billing)
Vendor bills against a master contract by percentage complete. Common in construction.
EXTRACT: "Current Payment Due" — NOT the contract total, NOT completed-to-date.
Key fields: Original Contract Amount, Total Completed & Stored to Date, Less Previous Certificates for Payment, Current Payment Due (THIS IS THE AMOUNT), Balance to Finish.
Known pay application vendors: Wayne Automatic Sprinkler, Reinhold Electric, Karsten Incorporated, Central Air Heating and Cooling.

### Type C: Account Statement (Multiple Invoices)
One statement covering multiple underlying invoices (e.g., RP Lumber).
DO NOT treat the statement total as one invoice. Parse EACH line item as a separate row with its own invoice number, date, and amount.

## TRADE CATEGORY ASSIGNMENT

Assign each invoice to exactly one of these categories (title company portal values):
- General Construction
- HVAC
- Electrical
- Plumbing (includes fire sprinkler/protection)
- Sitework / Grading (includes concrete block, gravel, fill, erosion control, geotextile, rock/block delivery)
- Framing (includes lumber)
- Drywall (includes sheetrock, joint compound)
- Flooring
- Cabinets / Millwork (includes handrails, welding, railings)
- Roofing
- Windows / Doors
- Landscaping
- Permits / Fees (includes insurance, surcharges)
- Engineering / Architecture (includes survey, site meetings)
- Miscellaneous (includes fuel, petroleum)

Rules:
- "Electric" in vendor name → Electrical
- "Plumb" in vendor OR "sprinkler" or "fire protection" → Plumbing
- "HVAC" or "Air" or "Heating" or "Cooling" → HVAC
- Lumber/framing materials → Framing
- Drywall/sheetrock/joint compound → Drywall
- Concrete block, gravel, fill, geogrid, erosion → Sitework / Grading
- Flatwork, footing, slab, sidewalk → General Construction
- Dumpster, waste, portable toilet → General Construction
- Cabinet, millwork, handrail, welding → Cabinets / Millwork
- Survey, engineering, architecture → Engineering / Architecture
- Insurance, premium, permit, fee → Permits / Fees
- Fuel, diesel, petroleum → Miscellaneous
- Default → General Construction

## KNOWN VENDORS (The Legion)

| Vendor | Type | Trade |
|---|---|---|
| R.P. Lumber Co., Inc. | Statement | Framing |
| RKM Framing LLC | Invoice | Framing |
| Foundation Building Materials (FBM) | Invoice | Drywall |
| Reinhold Electric, Inc. | Pay App | Electrical |
| Central Air Heating and Cooling LLC | Pay App | HVAC |
| Karsten Incorporated | Pay App | Plumbing |
| Wayne Automatic Sprinkler Corp. | Pay App | Plumbing |
| Triple T Hauling, LLC | Invoice | Sitework / Grading |
| New Frontier Materials | Invoice | Sitework / Grading |
| Kienstra / American Ready Mix | Invoice | Sitework / Grading |
| Golden Triangle Concrete | Invoice | Sitework / Grading |
| MidWest Block (Best Block) | Invoice | Sitework / Grading |
| Nu Way Concrete Forms | Invoice | Sitework / Grading |
| ASP Enterprises Inc | Invoice | Sitework / Grading |
| Banze Flatwork, LLC | Invoice | General Construction |
| Tomam LLC | Invoice | General Construction |
| Scapers LLC | Invoice | General Construction |
| Region Welding of Missouri | Invoice | Cabinets / Millwork |
| VonArx Engineering | Invoice | Engineering / Architecture |
| Burdine and Associates | Invoice | Engineering / Architecture |
| Energy Petroleum Co. | Invoice | Miscellaneous |
| Herc Rentals | Invoice | General Construction |
| American Burglary and Fire | Invoice | General Construction |

## EDGE CASES

- Partial payments: If "Amount Paid" or "Remaining Balance" exists and differs from invoice total, use the remaining balance and set missingDataFlag to "Partial payment — verify amount".
- If address is 849 American Legion Dr, default jobName to "The Legion".
- For any field you cannot confidently extract, set missingDataFlag to a short description of what's missing.

## OUTPUT FORMAT

Return a JSON array ONLY, no other text. Each item:
{
  "vendor": "Full legal vendor name",
  "invoiceNumber": "Exact string from document",
  "invoiceDate": "MM/DD/YYYY",
  "amountDue": 1234.56,
  "jobName": "The Legion",
  "tradeCategory": "One of the exact categories listed above",
  "invoiceType": "standard" | "pay_application" | "statement_line",
  "missingDataFlag": null or "description of issue"
}

For pay applications: amountDue MUST be the Current Payment Due, not the contract total.
For statements: return one row per line item invoice, not the statement total.
amountDue must be a number (no $ sign, no commas).`;

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
      max_tokens: 8192,
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
