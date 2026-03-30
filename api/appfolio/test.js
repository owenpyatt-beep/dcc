// Tests Appfolio Stack API connectivity
// GET /api/appfolio/test

export default async function handler(req, res) {
  const { APPFOLIO_CLIENT_ID, APPFOLIO_CLIENT_SECRET, APPFOLIO_DATABASE } = process.env;

  if (!APPFOLIO_CLIENT_ID || !APPFOLIO_CLIENT_SECRET || !APPFOLIO_DATABASE) {
    return res.status(500).json({
      ok: false,
      error: "Missing environment variables",
      required: ["APPFOLIO_CLIENT_ID", "APPFOLIO_CLIENT_SECRET", "APPFOLIO_DATABASE"],
    });
  }

  const auth = Buffer.from(`${APPFOLIO_CLIENT_ID}:${APPFOLIO_CLIENT_SECRET}`).toString("base64");
  const base = `https://${APPFOLIO_DATABASE}.appfolio.com/api/v1`;

  try {
    const response = await fetch(`${base}/properties.json`, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    if (response.status === 406) {
      return res.status(406).json({ ok: false, error: "Content-Type rejected — API may require OAuth" });
    }

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        ok: false,
        error: `Appfolio returned ${response.status}: ${text.slice(0, 200)}`,
      });
    }

    const data = await response.json();
    const count = Array.isArray(data) ? data.length : data.results?.length || 0;

    return res.status(200).json({
      ok: true,
      database: APPFOLIO_DATABASE,
      propertiesFound: count,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
