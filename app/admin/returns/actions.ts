"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export type ActionResult = { error: string } | undefined;

const noteSchema = z.object({
  adminNote: z.string().trim().max(1000).default(""),
});

export async function approveReturn(
  returnId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = noteSchema.safeParse({ adminNote: formData.get("adminNote") ?? "" });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const { error } = await createAdminClient()
    .from("return_requests")
    .update({ status: "approved", admin_note: parsed.data.adminNote })
    .eq("id", returnId)
    .eq("status", "pending");
  if (error) return { error: error.message };

  revalidatePath("/admin/returns");
  return undefined;
}

export async function rejectReturn(
  returnId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = noteSchema.safeParse({ adminNote: formData.get("adminNote") ?? "" });
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };
  if (!parsed.data.adminNote) {
    return { error: "Add a note explaining why, so the customer sees a reason." };
  }

  const { error } = await createAdminClient()
    .from("return_requests")
    .update({ status: "rejected", admin_note: parsed.data.adminNote })
    .eq("id", returnId)
    .eq("status", "pending");
  if (error) return { error: error.message };

  revalidatePath("/admin/returns");
  return undefined;
}
