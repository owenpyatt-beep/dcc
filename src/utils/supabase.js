import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authenticated fetch helper — attaches the user's JWT to API calls
export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
