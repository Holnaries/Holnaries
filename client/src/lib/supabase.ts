import { createClient } from "@supabase/supabase-js";
import type { HomeContent } from "./content";
import { DEFAULT_CONTENT, normalizeHomeContent } from "./content";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
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

export type AdminRecord = {
  user_id: string;
  email: string | null;
  role: "admin" | "super_admin";
  created_at: string;
};

export async function isSuperAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return data?.role === "super_admin";
}

export async function listAdmins(): Promise<AdminRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, email, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminRecord[];
}

export async function addAdmin(email: string, password: string): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const trimmedEmail = email.trim();
  if (!trimmedEmail) throw new Error("Email is required.");
  if (password.length < 8)
    throw new Error("Password must be at least 8 characters.");
  const { data: before } = await supabase.auth.getSession();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
  });
  if (signUpError) throw signUpError;
  const newUserId = signUpData.user?.id;
  if (!newUserId) throw new Error("Could not create the user account.");
  // Restore the super-admin session in case signUp switched accounts, so the
  // insert below runs as the super admin (RLS requires it).
  if (before.session) {
    const { error: restoreError } = await supabase.auth.setSession({
      access_token: before.session.access_token,
      refresh_token: before.session.refresh_token,
    });
    if (restoreError) console.warn("Could not restore session:", restoreError.message);
  }
  const { error: insertError } = await supabase
    .from("admin_users")
    .insert({ user_id: newUserId, email: trimmedEmail, role: "admin" });
  if (insertError) throw insertError;
  return newUserId;
}

export async function removeAdmin(userId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/admin`,
  });
  if (error) throw error;
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
