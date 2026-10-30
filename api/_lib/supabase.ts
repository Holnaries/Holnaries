export function supabaseConfig(): { url: string; key: string } {
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  return { url, key };
}

export async function verifySupabaseAdmin(
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

export function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}