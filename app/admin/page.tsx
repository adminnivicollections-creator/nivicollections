import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/config";
import type { Order, OrderItem, ProductVariant } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// Same definitions used on /admin/orders, kept identical rather than
// reinvented so the two pages never disagree about what "to fulfil" means.
const ACTIONABLE = new Set(["paid", "packed"]);
const COUNTED = new Set(["paid", "packed", "shipped", "delivered"]);
const LOW_STOCK_THRESHOLD = 3;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Midnight today, India time, as the equivalent UTC instant — for comparing
 * against timestamptz columns, which always come back UTC. IST has no
 * daylight saving, so a fixed offset is exact here, not an approximation.
 */
function startOfTodayIST(): Date {
  const shifted = new Date(Date.now() + IST_OFFSET_MS);
  const midnightShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  return new Date(midnightShifted - IST_OFFSET_MS);
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient();
  const today = startOfTodayIST();

  const [
    { data: orders, error: ordersError },
    { data: variants, error: variantsError },
    { count: questionCount },
    { count: answeredCount },
    { count: subscriberCount },
  ] = await Promise.all([
    admin
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(500)
      .overrideTypes<(Order & { order_items: OrderItem[] })[]>(),
    admin
      .from("product_variants")
      .select("*, products(name, active)")
      .overrideTypes<(ProductVariant & { products: { name: string; active: boolean } | null })[]>(),
    admin.from("product_questions").select("id", { count: "exact", head: true }),
    admin.from("product_answers").select("id", { count: "exact", head: true }),
    admin.from("subscribers").select("id", { count: "exact", head: true }),
  ]);

  if (ordersError) throw ordersError;
  if (variantsError) throw variantsError;

  const toFulfil = orders.filter((o) => ACTIONABLE.has(o.status));
  const revenue = orders
    .filter((o) => COUNTED.has(o.status))
    .reduce((sum, o) => sum + o.total_paise, 0);

  const todaysOrders = orders.filter((o) => new Date(o.created_at) >= today);
  const todaysSales = todaysOrders
    .filter((o) => COUNTED.has(o.status))
    .reduce((sum, o) => sum + o.total_paise, 0);

  const lowStock = (variants ?? [])
    .filter((v) => v.products?.active && v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);
  const soldOut = (variants ?? []).filter(
    (v) => v.products?.active && v.stock === 0,
  );

  const salesByProduct = new Map<string, number>();
  for (const o of orders) {
    if (!COUNTED.has(o.status)) continue;
    for (const item of o.order_items) {
      salesByProduct.set(
        item.product_name,
        (salesByProduct.get(item.product_name) ?? 0) + item.qty,
      );
    }
  }
  const bestSellers = [...salesByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const unanswered = Math.max(0, (questionCount ?? 0) - (answeredCount ?? 0));

  return (
    <div className="py-10">
      <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
            Today&apos;s sales
          </dt>
          <dd className="mt-1 font-serif text-3xl font-light">
            {formatINR(todaysSales)}
          </dd>
          <p className="mt-1 text-xs text-ink/40">
            {todaysOrders.length} order{todaysOrders.length === 1 ? "" : "s"}{" "}
            placed today
          </p>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
            To fulfil
          </dt>
          <dd className="mt-1 font-serif text-3xl font-light">
            <Link href="/admin/orders" className="hover:text-gold">
              {toFulfil.length}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
            Total revenue
          </dt>
          <dd className="mt-1 font-serif text-3xl font-light">
            {formatINR(revenue)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
            Unanswered questions
          </dt>
          <dd className="mt-1 font-serif text-3xl font-light">
            <Link href="/admin/questions" className="hover:text-gold">
              {unanswered}
            </Link>
          </dd>
        </div>
      </dl>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Needs attention
          </h2>
          {lowStock.length === 0 && soldOut.length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">
              Nothing low on stock right now.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-sm">
              {soldOut.map((v) => (
                <li key={v.id} className="flex justify-between py-3">
                  <span>
                    {v.products?.name} — {v.size}
                  </span>
                  <span className="text-red-700">Sold out</span>
                </li>
              ))}
              {lowStock.map((v) => (
                <li key={v.id} className="flex justify-between py-3">
                  <span>
                    {v.products?.name} — {v.size}
                  </span>
                  <span className="text-gold">{v.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Best sellers
          </h2>
          {bestSellers.length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">
              Not enough paid orders yet to show best sellers.
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-sm">
              {bestSellers.map(([name, qty]) => (
                <li key={name} className="flex justify-between py-3">
                  <span>{name}</span>
                  <span className="text-ink/60">
                    {qty} sold
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="mt-14">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-[11px] uppercase tracking-[0.15em] text-gold"
          >
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-[11px] uppercase tracking-[0.15em] text-ink/50">
                <tr>
                  <th className="py-2 pr-4 font-normal">Order</th>
                  <th className="py-2 pr-4 font-normal">Date</th>
                  <th className="py-2 pr-4 font-normal">Total</th>
                  <th className="py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs hover:text-gold"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-ink/60">
                      {new Date(o.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 pr-4">{formatINR(o.total_paise)}</td>
                    <td className="py-3 text-ink/60">
                      {o.status.replace("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-14 text-xs text-ink/40">
        {subscriberCount ?? 0} people on your{" "}
        <Link href="/admin/subscribers" className="underline">
          launch list
        </Link>
        .
      </p>
    </div>
  );
}
