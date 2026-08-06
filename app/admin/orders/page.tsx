import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/config";
import type { Order } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type Row = Order & { order_items: { qty: number }[] };

export default async function AdminOrdersPage() {
  const { data: orders, error } = await createAdminClient()
    .from("orders")
    .select("*, order_items(qty)")
    .order("created_at", { ascending: false })
    .limit(100)
    .overrideTypes<Row[]>();

  if (error) throw error;

  return (
    <div className="py-10">
      {orders.length === 0 ? (
        <p className="py-20 text-center text-ink/60">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
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
                  <td className="py-4 pr-4 font-mono text-xs">
                    {o.order_number}
                  </td>
                  <td className="py-4 pr-4 text-ink/60">
                    {new Date(o.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-4 pr-4 text-ink/60">{o.email}</td>
                  <td className="py-4 pr-4">
                    {o.order_items.reduce((n, i) => n + i.qty, 0)}
                  </td>
                  <td className="py-4 pr-4">{formatINR(o.total_paise)}</td>
                  <td className="py-4 text-ink/60">
                    {o.status.replace("_", " ")}
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
