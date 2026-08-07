import Link from "next/link";
import { requireUser, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreSettings } from "@/lib/settings";
import { isReturnEligible } from "@/lib/returns";
import { formatINR } from "@/lib/config";
import type { Order, OrderItem, ReturnRequest } from "@/lib/supabase/types";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account" };

const RETURN_STATUS_LABEL: Record<string, string> = {
  pending: "Return pending review",
  approved: "Return approved",
  rejected: "Return not approved",
};

export default async function AccountPage() {
  const userId = await requireUser();
  const admin = createAdminClient();

  const [{ data: orders }, adminFlag, settings] = await Promise.all([
    admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .overrideTypes<(Order & { order_items: OrderItem[] })[]>(),
    isAdmin(userId),
    getStoreSettings(),
  ]);

  const orderIds = (orders ?? []).map((o) => o.id);
  // Not .overrideTypes<ReturnRequest[]>() here — postgrest-js's inference
  // for the text[] photo_paths column doesn't resolve to a plain string[],
  // so a plain cast after the fact is the reliable fix.
  const { data: returns } = orderIds.length
    ? ((await admin
        .from("return_requests")
        .select("*")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })) as { data: ReturnRequest[] | null })
    : { data: [] as ReturnRequest[] };

  // Most recent request per order — an order can have a rejected-then-new
  // pending one, and only the latest matters for what to show here.
  const latestReturnByOrder = new Map<string, ReturnRequest>();
  for (const r of returns ?? []) {
    if (!latestReturnByOrder.has(r.order_id)) latestReturnByOrder.set(r.order_id, r);
  }

  return (
    <div className="min-h-dvh bg-[#0b0906] px-5 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-4xl font-light text-[#f3e6cc]">
            Your account
          </h1>
          <SignOutButton />
        </div>

        <div className="mt-6 flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.2em]">
          <Link href="/account/password" className="text-[#c59e5a]">
            Change password
          </Link>
          <Link href="/account/wishlist" className="text-[#c59e5a]">
            Wishlist
          </Link>
          {adminFlag && (
            <Link href="/admin" className="text-[#c59e5a]">
              Admin panel
            </Link>
          )}
        </div>

        <h2 className="mt-14 font-serif text-2xl font-light text-[#f3e6cc]">
          Orders
        </h2>
        {!orders || orders.length === 0 ? (
          <p className="mt-6 text-[#f3e6cc]/60">
            You have not placed an order yet.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-[#c59e5a]/15 border-y border-[#c59e5a]/15">
            {orders.map((o) => {
              const existingReturn = latestReturnByOrder.get(o.id);
              const canRequestReturn =
                (!existingReturn || existingReturn.status === "rejected") &&
                isReturnEligible(o, settings);

              return (
                <li key={o.id} className="py-6">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-mono text-xs text-[#f3e6cc]/60">
                      {o.order_number}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.15em] text-[#c59e5a]">
                      {o.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#f3e6cc]/70">
                    {o.order_items
                      .map((i) => `${i.product_name} (${i.size}) × ${i.qty}`)
                      .join(", ")}
                  </p>
                  <p className="mt-1 text-sm text-[#f3e6cc]">
                    {formatINR(o.total_paise)}
                  </p>
                  {existingReturn && (
                    <p className="mt-2 text-xs text-[#f3e6cc]/50">
                      {RETURN_STATUS_LABEL[existingReturn.status]}
                    </p>
                  )}
                  {canRequestReturn && (
                    <Link
                      href={`/account/returns/${o.id}`}
                      className="mt-2 inline-block text-[11px] uppercase tracking-[0.15em] text-[#c59e5a] hover:text-[#f3e6cc]"
                    >
                      Request a return
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
