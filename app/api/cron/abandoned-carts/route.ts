import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAbandonedCartEmail } from "@/lib/email";

const STAGE_1_HOURS = 2;
const STAGE_2_HOURS = 24;

async function sendStage(
  admin: ReturnType<typeof createAdminClient>,
  stage: 1 | 2,
  cutoffIso: string,
) {
  const column = stage === 1 ? "abandoned_email_1_sent_at" : "abandoned_email_2_sent_at";

  let query = admin
    .from("orders")
    .select("id")
    .eq("status", "pending_payment")
    .lte("created_at", cutoffIso)
    .is(column, null)
    .limit(200);

  // Stage 2 only goes to orders that already got stage 1 — never skip ahead.
  if (stage === 2) query = query.not("abandoned_email_1_sent_at", "is", null);

  const { data: candidates, error } = await query;
  if (error) throw error;

  let sent = 0;
  for (const { id } of candidates ?? []) {
    // Claim the row atomically before sending, not after — if the email
    // send itself fails partway, we accept missing that one nudge rather
    // than risk a double-send from a naive fetch-then-send-then-update.
    const now = new Date().toISOString();
    const { data: claimed } = await admin
      .from("orders")
      .update(
        stage === 1
          ? { abandoned_email_1_sent_at: now }
          : { abandoned_email_2_sent_at: now },
      )
      .eq("id", id)
      .is(column, null)
      .select("id");
    if (!claimed || claimed.length === 0) continue;

    try {
      await sendAbandonedCartEmail(id, stage);
      sent++;
    } catch (e) {
      console.error(`Abandoned-cart stage ${stage} email failed for order ${id}`, e);
    }
  }
  return sent;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const stage1Cutoff = new Date(now - STAGE_1_HOURS * 60 * 60 * 1000).toISOString();
  const stage2Cutoff = new Date(now - STAGE_2_HOURS * 60 * 60 * 1000).toISOString();

  const [stage1Sent, stage2Sent] = await Promise.all([
    sendStage(admin, 1, stage1Cutoff),
    sendStage(admin, 2, stage2Cutoff),
  ]);

  return NextResponse.json({ ok: true, stage1Sent, stage2Sent });
}
