// Debug endpoint — checks all env vars and connections
// GET /api/debug

import { supabaseAdmin } from "./_supabase.js";

export default async function handler(req, res) {
  const checks = {};

  // Check env vars (show existence, not values)
  checks.ANTHROPIC_API_KEY = !!process.env.ANTHROPIC_API_KEY;
  checks.REACT_APP_ANTHROPIC_API_KEY = !!process.env.REACT_APP_ANTHROPIC_API_KEY;
  checks.SUPABASE_SERVICE_ROLE_KEY = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  checks.SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "not set";
  checks.TWILIO_ACCOUNT_SID = !!process.env.TWILIO_ACCOUNT_SID;
  checks.TWILIO_AUTH_TOKEN = !!process.env.TWILIO_AUTH_TOKEN;
  checks.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "not set";

  // Test Supabase connection
  try {
    const { data, error } = await supabaseAdmin.from("properties").select("id, name");
    if (error) {
      checks.supabase = `ERROR: ${error.message}`;
    } else {
      checks.supabase = `OK — ${data.length} properties`;
      checks.properties = data.map((p) => p.name);
    }
  } catch (err) {
    checks.supabase = `EXCEPTION: ${err.message}`;
  }

  // Test invoice count
  try {
    const { count, error } = await supabaseAdmin.from("invoices").select("id", { count: "exact", head: true });
    checks.invoices = error ? `ERROR: ${error.message}` : `${count} invoices`;
  } catch (err) {
    checks.invoices = `EXCEPTION: ${err.message}`;
  }

  // Test Anthropic key format
  const key = process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_ANTHROPIC_API_KEY || "";
  checks.anthropicKeyPrefix = key ? key.slice(0, 10) + "..." : "MISSING";

  return res.status(200).json(checks);
}
