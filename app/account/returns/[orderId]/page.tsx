import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreSettings } from "@/lib/settings";
import { isReturnEligible } from "@/lib/returns";
import type { Order, ReturnRequest } from "@/lib/supabase/types";
import { submitReturnRequest } from "../actions";
import { ReturnRequestForm } from "./ReturnRequestForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Request a return" };

const REASON_LABEL: Record<string, string> = {
  defective: "Item arrived defective or damaged",
  wrong_item: "I received the wrong item",
  changed_mind: "I changed my mind",
  other: "Other",
};

export default async function RequestReturnPage({
  params,
}: PageProps<"/account/returns/[orderId]">) {
  const { orderId } = await params;
  const userId = await requireUser();
  const admin = createAdminClient();

  const [{ data: order }, settings] = await Promise.all([
    admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle()
      .overrideTypes<Order>(),
    getStoreSettings(),
  ]);

  if (!order || order.user_id !== userId) notFound();

  const { data: existing } = await admin
    .from("return_requests")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .overrideTypes<ReturnRequest>();

  const eligible = isReturnEligible(order, settings);
  const action = submitReturnRequest.bind(null, orderId);

  return (
    <div className="min-h-dvh bg-[#0b0906] px-5 py-16">
      <div className="mx-auto max-w-xl">
        <Link
          href="/account"
          className="text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/50 hover:text-[#f3e6cc]"
        >
          ← Your account
        </Link>

        <h1 className="mt-4 font-serif text-3xl font-light text-[#f3e6cc]">
          Request a return
        </h1>
        <p className="mt-1 text-sm text-[#f3e6cc]/60">
          Order <span className="font-mono">{order.order_number}</span>
        </p>

        {existing && existing.status === "pending" ? (
          <div className="mt-10 border border-[#c59e5a]/30 p-6 text-sm text-[#f3e6cc]/80">
            <p className="text-[#c59e5a]">Return request pending review.</p>
            <p className="mt-2">Reason: {REASON_LABEL[existing.reason]}</p>
            {existing.description && (
              <p className="mt-2">&ldquo;{existing.description}&rdquo;</p>
            )}
          </div>
        ) : existing && existing.status === "approved" ? (
          <div className="mt-10 border border-[#c59e5a]/30 p-6 text-sm text-[#f3e6cc]/80">
            <p className="text-[#c59e5a]">
              Your return was approved. We&rsquo;ll be in touch about next steps.
            </p>
          </div>
        ) : !eligible ? (
          <p className="mt-10 text-sm text-[#f3e6cc]/60">
            This order isn&rsquo;t eligible for a return — either it hasn&rsquo;t
            been delivered yet, or the {settings.return_window_days}-day return
            window has passed.
          </p>
        ) : (
          <>
            {existing && existing.status === "rejected" && (
              <div className="mt-8 border border-red-900/40 bg-red-950/20 p-4 text-sm text-[#f3e6cc]/70">
                <p>Your previous request wasn&rsquo;t approved.</p>
                {existing.admin_note && (
                  <p className="mt-1">&ldquo;{existing.admin_note}&rdquo;</p>
                )}
                <p className="mt-2">You can submit a new one below.</p>
              </div>
            )}
            <ReturnRequestForm action={action} />
          </>
        )}
      </div>
    </div>
  );
}
