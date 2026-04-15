// Server-side Supabase client with service role key
// Used by Vercel serverless functions — bypasses RLS

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "https://vounucblmnpqabpclkfi.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY not set — server-side Supabase calls will fail");
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || "", {
  auth: { persistSession: false },
});
