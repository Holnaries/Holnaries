// Vercel serverless function: booking status update / delete (admin only).
// Self-contained for the same ESM resolution reason as api/bookings.ts.

type JsonRes = {
  status: (code: number) => JsonRes;
  setHeader: (name: string, value: string) => JsonRes;
  end: (body: string) => void;
};

function supabaseConfig(): { url: string; key: string } {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  return { url, key };
}

async function verifySupabaseAdmin(
  url: string,
  key: string,
  token: string
): Promise<boolean> {
  if (!url || !key || !token) return false;
  try {
    const userRes = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) return false;
    const user = (await userRes.json()) as { id?: string };
    if (!user?.id) return false;
    const adminRes = await fetch(
      `${url}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id`,
      { headers: { apikey: key, Authorization: `Bearer ${token}` } }
    );
    if (!adminRes.ok) return false;
    const rows = (await adminRes.json()) as Array<{ user_id: string }>;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

function json(res: JsonRes, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

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
    if (!r.ok) {
      console.error(
        "Booking update failed:",
        r.status,
        (await r.text()).slice(0, 500)
      );
      json(res, 500, { error: "Could not update this request." });
      return;
    }
    json(res, 200, { ok: true });
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
    if (!r.ok) {
      console.error(
        "Booking delete failed:",
        r.status,
        (await r.text()).slice(0, 500)
      );
      json(res, 500, { error: "Could not delete this request." });
      return;
    }
    json(res, 200, { ok: true });
    return;
  }

  json(res, 405, { error: "Method not allowed." });
}
