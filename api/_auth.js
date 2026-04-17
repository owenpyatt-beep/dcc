// Shared auth verification for serverless endpoints
// Returns the user object if valid, null if not

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}
