import { supabase } from "./supabase";
import type { HomeContent } from "./content";
import { DEFAULT_CONTENT, normalizeHomeContent } from "./content";

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Local backend API (used until the Supabase project is connected).
// Once Supabase is configured, `lib/supabase.ts` takes over automatically.
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options?: RequestInit & { json?: unknown }
): Promise<T> {
  const { json, ...init } = options ?? {};
  const extra = await authHeaders();
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...extra,
      ...init.headers,
    },
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function loadLocalContent(): Promise<HomeContent | null> {
  const { content } = await request<{ content: HomeContent | null }>(
    "/api/content"
  );
  return content ? normalizeHomeContent(content) : null;
}

export async function saveLocalContent(content: HomeContent) {
  await request("/api/content", { method: "PUT", json: { content } });
}

export async function localLogin(password: string) {
  await request<{ ok: boolean }>("/api/admin/login", {
    method: "POST",
    json: { password },
  });
}

export async function localLogout() {
  await request("/api/admin/logout", { method: "POST" });
}

export async function localMe(): Promise<boolean> {
  const { authorized } = await request<{ authorized: boolean }>("/api/admin/me");
  return authorized;
}

export async function uploadLocalImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 8 * 1024 * 1024)
    throw new Error("Images must be 8 MB or smaller.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
  const { url } = await request<{ url: string }>("/api/upload", {
    method: "POST",
    json: { dataUrl },
  });
  return url;
}

export type BookingInput = {
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  note?: string;
};

export type BookingRecord = BookingInput & {
  id: string;
  status: "new" | "done";
  createdAt: string;
};

export async function createBooking(input: BookingInput): Promise<void> {
  await request("/api/bookings", { method: "POST", json: input });
}

export async function listBookings(): Promise<BookingRecord[]> {
  const { bookings } = await request<{ bookings: BookingRecord[] }>(
    "/api/bookings"
  );
  return bookings;
}

export async function setBookingStatus(id: string, status: "new" | "done") {
  await request(`/api/bookings/${id}`, { method: "PATCH", json: { status } });
}

export async function deleteBooking(id: string) {
  await request(`/api/bookings/${id}`, { method: "DELETE" });
}

// Re-exported so callers can treat "no saved content" and "starter" the same.
export { DEFAULT_CONTENT };
