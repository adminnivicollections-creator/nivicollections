import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

/** The signed-in user's id, or null. Verified against the JWT signature. */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

/**
 * Admin check. The role is read from the profiles table with the service-role
 * client — never from JWT metadata, which the user can edit on themselves.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.role === "admin";
}

/** Redirects instead of returning when the caller is not an admin. */
export async function requireAdmin(): Promise<string> {
  const userId = await getUserId();
  if (!userId) redirect("/login?next=/admin");
  if (!(await isAdmin(userId))) redirect("/");
  return userId;
}

export async function requireUser(): Promise<string> {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  return userId;
}
