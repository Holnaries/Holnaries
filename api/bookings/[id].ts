import { supabaseConfig, verifySupabaseAdmin, json } from "../../_lib/supabase";

export default async function handler(req: any, res: any) {
  const { url, key } = supabaseConfig();
  if (!url || !key) {
    json(res, 500, { error: "Supabase is not configured." });
    return;
  }
  const id = String(req.query?.id ?? "").trim();
  if (!id) {
    json(res, 400, { error: "Missing booking id." });
    return;
  }

  const authHeader = String(req.headers.authorization ?? "");
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const isAdmin = await verifySupabaseAdmin(url, key, token);
  if (!isAdmin) {
    json(res, 401, { error: "Admin sign-in required." });
    return;
  }

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const status = body.status === "done" ? "done" : "new";
    const r = await fetch(
      `${url}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ status }),
      }
    );
    json(res, r.ok ? 200 : r.status, r.ok ? { ok: true } : { error: await r.text() });
    return;
  }

  if (req.method === "DELETE") {
    const r = await fetch(
      `${url}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          apikey: key,
          Authorization: `Bearer ${token}`,
          Prefer: "return=minimal",
        },
      }
    );
    json(res, r.ok ? 200 : r.status, r.ok ? { ok: true } : { error: await r.text() });
    return;
  }

  json(res, 405, { error: "Method not allowed." });
}