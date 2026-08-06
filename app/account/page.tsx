import Link from "next/link";
import { requireUser, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/config";
import type { Order, OrderItem } from "@/lib/supabase/types";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const userId = await requireUser();
  const admin = createAdminClient();

  const [{ data: orders }, adminFlag] = await Promise.all([
    admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .overrideTypes<(Order & { order_items: OrderItem[] })[]>(),
    isAdmin(userId),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl font-light text-ink">Your account</h1>
        <SignOutButton />
      </div>

      <div className="mt-6 flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.2em]">
        <Link href="/account/password" className="text-gold">
          Change password
        </Link>
        {adminFlag && (
          <Link href="/admin" className="text-gold">
            Admin panel
          </Link>
        )}
      </div>

      <h2 className="mt-14 font-serif text-2xl font-light text-ink">Orders</h2>
      {!orders || orders.length === 0 ? (
        <p className="mt-6 text-ink/60">You have not placed an order yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
          {orders.map((o) => (
            <li key={o.id} className="py-6">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-mono text-xs text-ink/60">
                  {o.order_number}
                </span>
                <span className="text-[11px] uppercase tracking-[0.15em] text-gold">
                  {o.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink/70">
                {o.order_items.map((i) => `${i.product_name} (${i.size}) × ${i.qty}`).join(", ")}
              </p>
              <p className="mt-1 text-sm text-ink">{formatINR(o.total_paise)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
