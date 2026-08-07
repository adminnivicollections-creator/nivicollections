import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/config";

export const dynamic = "force-dynamic";

type OrderRow = {
  email: string;
  phone: string;
  user_id: string | null;
  total_paise: number;
  status: string;
  created_at: string;
  shipping_address: { full_name?: string } | null;
};

// Customers aren't a separate table — guest checkout means the order itself
// is the source of truth for who a customer is. Group by email instead.
function groupByCustomer(orders: OrderRow[]) {
  const byEmail = new Map<
    string,
    {
      email: string;
      name: string;
      phone: string;
      hasAccount: boolean;
      orderCount: number;
      totalPaise: number;
      firstOrder: string;
      lastOrder: string;
    }
  >();

  for (const o of orders) {
    const existing = byEmail.get(o.email);
    const isPaid = o.status !== "pending_payment" && o.status !== "cancelled";
    if (!existing) {
      byEmail.set(o.email, {
        email: o.email,
        name: o.shipping_address?.full_name ?? "—",
        phone: o.phone,
        hasAccount: Boolean(o.user_id),
        orderCount: 1,
        totalPaise: isPaid ? o.total_paise : 0,
        firstOrder: o.created_at,
        lastOrder: o.created_at,
      });
    } else {
      existing.orderCount += 1;
      if (isPaid) existing.totalPaise += o.total_paise;
      if (o.user_id) existing.hasAccount = true;
      if (o.created_at < existing.firstOrder) existing.firstOrder = o.created_at;
      if (o.created_at > existing.lastOrder) existing.lastOrder = o.created_at;
    }
  }

  return [...byEmail.values()].sort((a, b) => b.totalPaise - a.totalPaise);
}

export default async function AdminCustomersPage() {
  const { data: orders, error } = await createAdminClient()
    .from("orders")
    .select("email, phone, user_id, total_paise, status, created_at, shipping_address")
    .order("created_at", { ascending: false })
    .overrideTypes<OrderRow[]>();

  if (error) throw error;

  const customers = groupByCustomer(orders);

  return (
    <div className="py-10">
      <h2 className="font-serif text-2xl font-light text-ink">Customers</h2>
      <p className="mt-1 text-sm text-ink/60">
        {customers.length} customer{customers.length === 1 ? "" : "s"}, built
        from every order placed (guest and account alike).
      </p>

      {customers.length === 0 ? (
        <p className="mt-10 text-ink/60">No orders yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-[11px] uppercase tracking-[0.15em] text-ink/50">
              <tr>
                <th className="py-3 pr-4 font-normal">Name</th>
                <th className="py-3 pr-4 font-normal">Contact</th>
                <th className="py-3 pr-4 font-normal">Account</th>
                <th className="py-3 pr-4 font-normal">Orders</th>
                <th className="py-3 pr-4 font-normal">Total spent</th>
                <th className="py-3 font-normal">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {customers.map((c) => (
                <tr key={c.email}>
                  <td className="py-4 pr-4 text-ink">{c.name}</td>
                  <td className="py-4 pr-4 text-ink/60">
                    <Link
                      href={`/admin/orders?q=${encodeURIComponent(c.email)}`}
                      className="hover:text-gold"
                    >
                      {c.email}
                    </Link>
                    <br />
                    {c.phone}
                  </td>
                  <td className="py-4 pr-4 text-ink/60">
                    {c.hasAccount ? "Registered" : "Guest"}
                  </td>
                  <td className="py-4 pr-4">{c.orderCount}</td>
                  <td className="py-4 pr-4">{formatINR(c.totalPaise)}</td>
                  <td className="py-4 text-ink/60">
                    {new Date(c.lastOrder).toLocaleDateString("en-IN")}
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
