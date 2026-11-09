// Vercel serverless function: public booking form + admin list.
// Kept self-contained (no local imports) because this project is ESM and
// Vercel's Node runtime resolves relative imports without adding extensions.

type JsonRes = {
  status: (code: number) => JsonRes;
  setHeader: (name: string, value: string) => JsonRes;
  end: (body: string) => void;
};

const DEFAULT_SUPABASE_URL = "https://ifdxagmyycmojahdyzzm.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "sb_publishable_ghMKMb9idel0s6UpgSyL4A_npbhjBih";

// Public values (same ones the browser receives). Used when the hosting
// project has no environment variables configured; env vars still win.
function supabaseConfig(): { url: string; key: string } {
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;
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

  if (req.method === "POST") {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const service = String(body.service ?? "").trim();
    const date = String(body.date ?? "").trim();
    const time = String(body.time ?? "").trim();
    const note = body.note ? String(body.note).trim() : "";
    if (!name || !phone || !service || !date || !time) {
      json(res, 400, { error: "Missing required booking fields." });
      return;
    }
    if (
      name.length > 120 ||
      phone.length > 20 ||
      service.length > 120 ||
      time.length > 20 ||
      note.length > 600
    ) {
      json(res, 400, { error: "One of the fields is too long." });
      return;
    }
    if (!/^[0-9+()\-\s]{6,20}$/.test(phone)) {
      json(res, 400, { error: "Please enter a valid phone number." });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      json(res, 400, { error: "Please choose a valid date." });
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
      note: note || null,
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
      console.error(
        "Booking insert failed:",
        r.status,
        (await r.text()).slice(0, 500)
      );
      json(res, 500, {
        error: "Could not save your request. Please try again.",
      });
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
    if (!r.ok) {
      console.error(
        "Booking list failed:",
        r.status,
        (await r.text()).slice(0, 500)
      );
      json(res, 502, { error: "Could not load consultation requests." });
      return;
    }
    const data = await r.json().catch(() => null);
    const bookings = Array.isArray(data)
      ? data.map((row: Record<string, unknown>) => ({
          ...row,
          createdAt: row.created_at ?? row.createdAt ?? "",
        }))
      : [];
    json(res, 200, { bookings });
    return;
  }

  json(res, 405, { error: "Method not allowed." });
}
