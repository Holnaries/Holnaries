import { supabaseConfig, verifySupabaseAdmin, json } from "./_lib/supabase";

export default async function handler(req: any, res: any) {
  const { url, key } = supabaseConfig();
  if (!url || !key) {
    json(res, 500, { error: "Supabase is not configured." });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const service = String(body.service ?? "").trim();
    const date = String(body.date ?? "").trim();
    const time = String(body.time ?? "").trim();
    const note = body.note ? String(body.note).trim() : null;
    if (!name || !phone || !service || !date || !time) {
      json(res, 400, { error: "Missing required booking fields." });
      return;
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const row = {
      id,
      name,
      phone,
      service,
      date,
      time,
      note,
      status: "new",
      created_at: new Date().toISOString(),
    };
    const r = await fetch(`${url}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      json(res, r.status, { error: await r.text() });
      return;
    }
    json(res, 201, { ok: true, id });
    return;
  }

  if (req.method === "GET") {
    const authHeader = String(req.headers.authorization ?? "");
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    const isAdmin = await verifySupabaseAdmin(url, key, token);
    if (!isAdmin) {
      json(res, 401, { error: "Admin sign-in required." });
      return;
    }
    const r = await fetch(
      `${url}/rest/v1/bookings?select=*&order=created_at.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${token}` } }
    );
    const data = await r.json().catch(() => []);
    json(res, r.status, { bookings: Array.isArray(data) ? data : [] });
    return;
  }

  json(res, 405, { error: "Method not allowed." });
}