"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export type SubscribeResult = { error: string } | { ok: string } | undefined;

const schema = z.email({ error: "Enter a valid email address." });

export async function subscribe(
  _prev: SubscribeResult,
  formData: FormData,
): Promise<SubscribeResult> {
  const parsed = schema.safeParse(
    String(formData.get("email") ?? "").trim().toLowerCase(),
  );
  if (!parsed.success) return { error: "Enter a valid email address." };

  const { error } = await createAdminClient()
    .from("subscribers")
    .insert({ email: parsed.data, source: "coming_soon" });

  // A repeat signup is not an error worth showing; treat it as success so the
  // form never reveals who is already on the list.
  if (error && error.code !== "23505") {
    console.error("Subscribe failed", error);
    return { error: "Something went wrong. Please try again." };
  }

  return { ok: "Thank you. We will write to you the moment we launch." };
}
