// Client-side Appfolio sync — calls our Vercel serverless function

export async function testConnection() {
  const res = await fetch("/api/appfolio/test");
  return res.json();
}

export async function syncProperties() {
  const res = await fetch("/api/appfolio/sync");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Sync failed (${res.status})`);
  }
  return res.json();
}
