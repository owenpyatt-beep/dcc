// Tests Appfolio API connectivity
// GET /api/appfolio/test

export default async function handler(req, res) {
  const { APPFOLIO_CLIENT_ID, APPFOLIO_CLIENT_SECRET, APPFOLIO_DATABASE } = process.env;

  if (!APPFOLIO_CLIENT_ID || !APPFOLIO_CLIENT_SECRET || !APPFOLIO_DATABASE) {
    return res.status(500).json({
      ok: false,
      error: "Missing Appfolio environment variables",
      required: ["APPFOLIO_CLIENT_ID", "APPFOLIO_CLIENT_SECRET", "APPFOLIO_DATABASE"],
    });
  }

  const auth = Buffer.from(`${APPFOLIO_CLIENT_ID}:${APPFOLIO_CLIENT_SECRET}`).toString("base64");
  const baseUrl = `https://${APPFOLIO_DATABASE}.appfolio.com`;

  try {
    // Try a lightweight report to verify credentials
    const response = await fetch(`${baseUrl}/api/v2/reports/chart_of_accounts.json`, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      return res.status(401).json({ ok: false, error: "Invalid Appfolio credentials" });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: `Appfolio returned ${response.status}: ${response.statusText}`,
      });
    }

    return res.status(200).json({ ok: true, database: APPFOLIO_DATABASE });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
