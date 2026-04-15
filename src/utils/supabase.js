import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://vounucblmnpqabpclkfi.supabase.co";
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "sb_publishable_7X6viP9n0LKz9MVhzgjsGA_juvR_C_h";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
