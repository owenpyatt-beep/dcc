// Syncs property data from Appfolio Reporting API v2
// GET /api/appfolio/sync
//
// Fetches rent roll and aged receivables, maps to DCC property model.
// Rate limit: 7 requests per 15 seconds — this endpoint makes 2 calls.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { APPFOLIO_CLIENT_ID, APPFOLIO_CLIENT_SECRET, APPFOLIO_DATABASE } = process.env;

  if (!APPFOLIO_CLIENT_ID || !APPFOLIO_CLIENT_SECRET || !APPFOLIO_DATABASE) {
    return res.status(500).json({ error: "Appfolio not configured" });
  }

  const auth = Buffer.from(`${APPFOLIO_CLIENT_ID}:${APPFOLIO_CLIENT_SECRET}`).toString("base64");
  const baseUrl = `https://${APPFOLIO_DATABASE}.appfolio.com/api/v2/reports`;
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };

  try {
    // Fetch rent roll and aged receivables in parallel
    const [rentRollRes, delinquencyRes] = await Promise.all([
      fetchAllPages(`${baseUrl}/rent_roll.json`, headers),
      fetchAllPages(`${baseUrl}/aged_receivables_summary.json`, headers),
    ]);

    // Group rent roll by property
    const propertyMap = {};

    for (const row of rentRollRes) {
      const propName = row.property_name || row.property || "Unknown";
      if (!propertyMap[propName]) {
        propertyMap[propName] = {
          name: propName,
          address: row.property_address || "",
          totalUnits: 0,
          occupiedUnits: 0,
          leasedUnits: 0,
          monthlyIncome: 0,
          units: [],
        };
      }
      const prop = propertyMap[propName];
      prop.totalUnits++;

      const isOccupied = !!(row.tenant_name || row.tenant || row.resident);
      const isLeased = !!(row.lease_start || row.lease_from || row.move_in);
      if (isOccupied) prop.occupiedUnits++;
      if (isLeased) prop.leasedUnits++;

      const rent = parseFloat(row.rent || row.market_rent || row.charge_amount || 0);
      if (isOccupied && rent > 0) prop.monthlyIncome += rent;

      prop.units.push({
        unit: row.unit || row.unit_name || row.unit_number || "",
        tenant: row.tenant_name || row.tenant || row.resident || null,
        rent,
        leaseStart: row.lease_start || row.lease_from || null,
        leaseEnd: row.lease_end || row.lease_to || null,
        moveIn: row.move_in || null,
        moveOut: row.move_out || null,
        status: isOccupied ? "occupied" : "vacant",
      });
    }

    // Process delinquency by property
    const delinquencyByProp = {};

    for (const row of delinquencyRes) {
      const propName = row.property_name || row.property || "Unknown";
      if (!delinquencyByProp[propName]) {
        delinquencyByProp[propName] = {
          delinquent30: 0,
          delinquent60: 0,
          delinquentAmount30: 0,
          delinquentAmount60: 0,
        };
      }
      const d = delinquencyByProp[propName];
      const totalDue = parseFloat(row.total_due || row.balance || row.amount_due || 0);
      const daysLate = parseInt(row.days_late || row.days_outstanding || 0, 10);

      // Also check column-based aging buckets
      const over60 = parseFloat(row["61_90"] || row["61-90"] || row.over_60 || 0)
        + parseFloat(row["91_plus"] || row["91+"] || row.over_90 || 0);
      const over30 = parseFloat(row["31_60"] || row["31-60"] || row.over_30 || 0);

      if (over60 > 0 || daysLate >= 60) {
        d.delinquent60++;
        d.delinquentAmount60 += over60 || totalDue;
      } else if (over30 > 0 || daysLate >= 30) {
        d.delinquent30++;
        d.delinquentAmount30 += over30 || totalDue;
      }
    }

    // Merge into final property list
    const properties = Object.entries(propertyMap).map(([name, prop]) => {
      const delinq = delinquencyByProp[name] || {
        delinquent30: 0,
        delinquent60: 0,
        delinquentAmount30: 0,
        delinquentAmount60: 0,
      };
      return {
        name: prop.name,
        address: prop.address,
        totalUnits: prop.totalUnits,
        occupiedUnits: prop.occupiedUnits,
        leasedUnits: prop.leasedUnits,
        monthlyIncome: Math.round(prop.monthlyIncome * 100) / 100,
        collectedIncome: 0, // not available from rent roll — needs payment report
        ...delinq,
        delinquentAmount30: Math.round(delinq.delinquentAmount30 * 100) / 100,
        delinquentAmount60: Math.round(delinq.delinquentAmount60 * 100) / 100,
      };
    });

    return res.status(200).json({ ok: true, properties, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Appfolio sync error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// Fetches all pages of a paginated Appfolio report
async function fetchAllPages(url, headers) {
  const rows = [];
  let nextUrl = url;

  while (nextUrl) {
    const res = await fetch(nextUrl, { headers });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Appfolio API ${res.status}: ${text}`);
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      // Non-paginated response
      rows.push(...data);
      break;
    }

    if (data.results) {
      rows.push(...data.results);
      nextUrl = data.next_page_url || null;
    } else {
      // Unknown format — return whatever we got
      rows.push(data);
      break;
    }
  }

  return rows;
}
