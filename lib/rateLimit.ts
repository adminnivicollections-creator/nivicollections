import "server-only";
import type { NextRequest } from "next/server";
import { createAdminClient } from "./supabase/admin";

/**
 * Vercel sets x-forwarded-for to the real client IP (leftmost entry is the
 * original client when the header carries a chain). Falls back to a
 * constant bucket if it's ever missing — better to rate-limit everyone
 * together than to silently skip limiting entirely.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/**
 * True if the request is within limit. `scope` namespaces the key so the
 * same IP hitting two different endpoints doesn't share one bucket.
 */
export async function checkRateLimit(
  request: NextRequest,
  scope: string,
  windowSeconds: number,
  max: number,
): Promise<boolean> {
  const key = `${scope}:${getClientIp(request)}`;
  const { data, error } = await createAdminClient().rpc("check_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  // Fail open: a rate-limit outage should not take checkout down with it.
  if (error) {
    console.error("Rate limit check failed", error);
    return true;
  }
  return data;
}
