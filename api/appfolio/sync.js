// Syncs property data from Appfolio Stack API
// GET /api/appfolio/sync
//
// Fetches Properties, Units, Tenants, Delinquent Charges, and Recurring Charges
// then maps to DCC managed property model.
//
// Rate limit: 7 requests per 15 seconds (pagination requests exempt)

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { APPFOLIO_CLIENT_ID, APPFOLIO_CLIENT_SECRET, APPFOLIO_DATABASE } = process.env;

  if (!APPFOLIO_CLIENT_ID || !APPFOLIO_CLIENT_SECRET || !APPFOLIO_DATABASE) {
    return res.status(500).json({ error: "Appfolio not configured" });
  }

  const auth = Buffer.from(`${APPFOLIO_CLIENT_ID}:${APPFOLIO_CLIENT_SECRET}`).toString("base64");
  const base = `https://${APPFOLIO_DATABASE}.appfolio.com/api/v1`;
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };

  try {
    // ── 1. Fetch all properties ────────────────────────
    const properties = await fetchAllPages(`${base}/properties.json`, headers);

    // ── 2. Fetch all units ─────────────────────────────
    const units = await fetchAllPages(`${base}/units.json`, headers);

    // ── 3. Fetch all tenants ───────────────────────────
    const tenants = await fetchAllPages(`${base}/tenants.json`, headers);

    // ── 4. Fetch delinquent charges ────────────────────
    const delinquentCharges = await fetchAllPages(`${base}/delinquent_charges.json`, headers);

    // ── 5. Fetch recurring charges (for income) ────────
    const recurringCharges = await fetchAllPages(`${base}/recurring_charges.json`, headers);

    // ── Map to DCC property model ──────────────────────
    const now = new Date();
    const result = properties.map((prop) => {
      const propId = prop.id || prop.Id;
      const propName = prop.name || prop.Name || "Unknown";

      // Units for this property
      const propUnits = units.filter(
        (u) => (u.property_id || u.PropertyId) === propId
      );
      const totalUnits = propUnits.length;

      // Tenants for this property
      const propTenants = tenants.filter(
        (t) => (t.property_id || t.PropertyId) === propId
      );

      // Active tenants = occupied units
      const activeTenants = propTenants.filter((t) => {
        const status = (t.status || t.Status || "").toLowerCase();
        const moveOut = t.move_out_on || t.MoveOutOn;
        // Active if status is current/active and no past move-out date
        if (status === "past" || status === "inactive" || status === "hidden") return false;
        if (moveOut && new Date(moveOut) < now) return false;
        return true;
      });
      const occupiedUnits = activeTenants.length;

      // Leased units = tenants with active lease
      const leasedTenants = activeTenants.filter((t) => {
        const leaseStart = t.lease_start_date || t.LeaseStartDate;
        const leaseEnd = t.lease_end_date || t.LeaseEndDate;
        if (!leaseStart) return false;
        if (leaseEnd && new Date(leaseEnd) < now) return false;
        return true;
      });
      const leasedUnits = leasedTenants.length;

      // Occupancy IDs for this property's active tenants
      const occupancyIds = new Set(
        activeTenants.map((t) => t.occupancy_id || t.OccupancyId).filter(Boolean)
      );

      // Delinquent charges for this property's occupancies
      const propDelinquent = delinquentCharges.filter((dc) => {
        const occId = dc.occupancy_id || dc.OccupancyId;
        return occupancyIds.has(occId);
      });

      // Categorize delinquency by age (30+ and 60+ days)
      let delinquent30 = 0;
      let delinquent60 = 0;
      let delinquentAmount30 = 0;
      let delinquentAmount60 = 0;
      const delinquentOccupancies30 = new Set();
      const delinquentOccupancies60 = new Set();

      for (const dc of propDelinquent) {
        const chargedOn = dc.charged_on || dc.ChargedOn;
        const amount = parseFloat(dc.amount_due || dc.AmountDue || 0);
        const daysLate = chargedOn
          ? Math.floor((now - new Date(chargedOn)) / (1000 * 60 * 60 * 24))
          : 0;
        const occId = dc.occupancy_id || dc.OccupancyId;

        if (daysLate >= 60) {
          delinquentAmount60 += amount;
          if (occId) delinquentOccupancies60.add(occId);
        } else if (daysLate >= 30) {
          delinquentAmount30 += amount;
          if (occId) delinquentOccupancies30.add(occId);
        }
      }
      delinquent30 = delinquentOccupancies30.size;
      delinquent60 = delinquentOccupancies60.size;

      // Monthly income from recurring charges
      const propRecurring = recurringCharges.filter((rc) => {
        const occId = rc.occupancy_id || rc.OccupancyId;
        return occupancyIds.has(occId);
      });

      let monthlyIncome = 0;
      for (const rc of propRecurring) {
        const amount = parseFloat(rc.amount || rc.Amount || 0);
        const freq = (rc.frequency || rc.Frequency || "").toLowerCase();
        const endDate = rc.end_date || rc.EndDate;

        // Skip expired charges
        if (endDate && new Date(endDate) < now) continue;

        // Normalize to monthly
        if (freq === "monthly" || freq === "month" || !freq) {
          monthlyIncome += amount;
        } else if (freq === "weekly" || freq === "week") {
          monthlyIncome += amount * 4.33;
        } else if (freq === "yearly" || freq === "annual" || freq === "year") {
          monthlyIncome += amount / 12;
        } else {
          monthlyIncome += amount; // assume monthly
        }
      }

      return {
        appfolioId: propId,
        name: propName,
        address: [
          prop.address_1 || prop.Address1 || "",
          prop.city || prop.City || "",
          prop.state || prop.State || "",
          prop.zip || prop.Zip || "",
        ]
          .filter(Boolean)
          .join(", "),
        propertyType: prop.property_type || prop.PropertyType || "Multi-Family",
        totalUnits,
        occupiedUnits,
        leasedUnits,
        delinquent30,
        delinquent60,
        delinquentAmount30: round2(delinquentAmount30),
        delinquentAmount60: round2(delinquentAmount60),
        monthlyIncome: round2(monthlyIncome),
        collectedIncome: 0, // requires payment ledger analysis
      };
    });

    return res.status(200).json({
      ok: true,
      properties: result,
      syncedAt: new Date().toISOString(),
      counts: {
        properties: properties.length,
        units: units.length,
        tenants: tenants.length,
        delinquentCharges: delinquentCharges.length,
        recurringCharges: recurringCharges.length,
      },
    });
  } catch (err) {
    console.error("Appfolio sync error:", err);
    return res.status(500).json({ error: err.message });
  }
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Fetches all pages of a paginated Appfolio response
// Pagination requests do NOT count against the rate limit
async function fetchAllPages(url, headers) {
  const rows = [];
  let nextUrl = url;

  while (nextUrl) {
    const res = await fetch(nextUrl, { headers });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Appfolio ${res.status} on ${nextUrl}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      rows.push(...data);
      break;
    }

    if (data.results) {
      rows.push(...data.results);
      nextUrl = data.next_page_url || null;
    } else {
      rows.push(data);
      break;
    }
  }

  return rows;
}
