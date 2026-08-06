import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/config";
import type { Order } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type Row = Order & { order_items: { qty: number }[] };

// Orders needing action, most urgent first. Everything else is history.
const ACTIONABLE = new Set(["paid", "packed"]);

export default async function AdminOrdersPage() {
  const { data: orders, error } = await createAdminClient()
    .from("orders")
    .select("*, order_items(qty)")
    .order("created_at", { ascending: false })
    .limit(200)
    .overrideTypes<Row[]>();

  if (error) throw error;

  const toFulfil = orders.filter((o) => ACTIONABLE.has(o.status));
  const revenue = orders
    .filter((o) => !["pending_payment", "cancelled", "refunded"].includes(o.status))
    .reduce((sum, o) => sum + o.total_paise, 0);

  return (
    <div className="py-10">
      <dl className="grid grid-cols-2 gap-6 border-b border-ink/10 pb-8 sm:grid-cols-3">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
            To fulfil
          </dt>
          <dd className="mt-1 font-serif text-3xl font-light">
            {toFulfil.length}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
            Orders
          </dt>
          <dd className="mt-1 font-serif text-3xl font-light">
            {orders.length}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
            Revenue
          </dt>
          <dd className="mt-1 font-serif text-3xl font-light">
            {formatINR(revenue)}
          </dd>
        </div>
      </dl>

      {orders.length === 0 ? (
        <p className="py-20 text-center text-ink/60">No orders yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-[11px] uppercase tracking-[0.15em] text-ink/50">
              <tr>
                <th className="py-3 pr-4 font-normal">Order</th>
                <th className="py-3 pr-4 font-normal">Date</th>
                <th className="py-3 pr-4 font-normal">Customer</th>
                <th className="py-3 pr-4 font-normal">Items</th>
                <th className="py-3 pr-4 font-normal">Total</th>
                <th className="py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-4 pr-4">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono text-xs text-ink hover:text-gold"
                    >
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="py-4 pr-4 text-ink/60">
                    {new Date(o.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-4 pr-4 text-ink/60">{o.email}</td>
                  <td className="py-4 pr-4">
                    {o.order_items.reduce((n, i) => n + i.qty, 0)}
                  </td>
                  <td className="py-4 pr-4">{formatINR(o.total_paise)}</td>
                  <td className="py-4">
                    <span
                      className={
                        ACTIONABLE.has(o.status)
                          ? "text-gold"
                          : o.status === "pending_payment"
                            ? "text-ink/40"
                            : "text-ink/60"
                      }
                    >
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
