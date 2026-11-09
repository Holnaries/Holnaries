import { createClient } from "@supabase/supabase-js";
import type { HomeContent } from "./content";
import { DEFAULT_CONTENT, normalizeHomeContent } from "./content";

const DEFAULT_SUPABASE_URL = "https://ifdxagmyycmojahdyzzm.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "sb_publishable_ghMKMb9idel0s6UpgSyL4A_npbhjBih";

// The Supabase project URL and publishable key are public values: they ship to
// every browser regardless. Keeping them as fallbacks means a deployment of
// this repo always runs in Supabase mode, even when the hosting project has no
// environment variables configured. Set VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY to point a deployment at a different Supabase project.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function loadHomeContent(): Promise<HomeContent> {
  if (!supabase) return DEFAULT_CONTENT;
  const { data, error } = await supabase
    .from("site_content")
    .select("content")
    .eq("id", "home")
    .maybeSingle();
  if (error) {
    console.warn(
      "Unable to load published site content; showing starter content.",
      error.message
    );
    return DEFAULT_CONTENT;
  }
  return data?.content ? normalizeHomeContent(data.content) : DEFAULT_CONTENT;
}

export async function saveHomeContent(content: HomeContent, userId: string) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { error } = await supabase
    .from("site_content")
    .upsert(
      {
        id: "home",
        content,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (error) throw error;
}

export async function isSiteAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("Unable to verify site-admin access.", error.message);
    return false;
  }
  return Boolean(data?.user_id);
}

export async function changeOwnPassword(newPassword: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
export async function uploadSiteImage(
  file: File,
  userId: string
): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 8 * 1024 * 1024)
    throw new Error("Images must be 8 MB or smaller.");
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  const path = `${userId}/${Date.now()}-${safeName}`;
  const { data, error } = await supabase.storage
    .from("site-media")
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
  if (error) throw error;
  return supabase.storage.from("site-media").getPublicUrl(data.path).data
    .publicUrl;
}
