import { supabaseAdmin } from "./_supabase.js";

export default async function handler(req, res) {
  const { error } = await supabaseAdmin
    .from("properties")
    .update({ name: "The Station", short_name: "Station" })
    .ilike("name", "%Old State%");

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true, message: "Renamed to The Station" });
}
