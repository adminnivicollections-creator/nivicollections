import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/config";
import type { Order, OrderItem } from "@/lib/supabase/types";

export const metadata = { title: "Track your order" };

// Guest orders have no session to authorise against, so the order number alone
// is not enough — knowing a number should never reveal someone's address.
// Requiring the matching email keeps lookups to the person who placed it.
async function lookup(orderNumber: string, email: string) {
  const { data } = await createAdminClient()
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber.trim().toUpperCase())
    .ilike("email", email.trim())
    .maybeSingle()
    .overrideTypes<Order & { order_items: OrderItem[] }>();
  return data;
}

export default async function TrackOrderPage({
  searchParams,
}: PageProps<"/orders/track">) {
  const params = await searchParams;
  const orderNumber = typeof params.order === "string" ? params.order : "";
  const email = typeof params.email === "string" ? params.email : "";
  const searched = Boolean(orderNumber && email);
  const order = searched ? await lookup(orderNumber, email) : null;

  const field =
    "mt-1 w-full border border-ink/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-ink";

  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      <h1 className="font-serif text-4xl font-light text-ink">
        Track your order
      </h1>

      <form method="GET" className="mt-10 space-y-5">
        <div>
          <label htmlFor="order" className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Order number
          </label>
          <input
            id="order"
            name="order"
            required
            placeholder="NV-1001"
            defaultValue={orderNumber}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Email used at checkout
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={email}
            className={field}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-ink py-4 text-[11px] uppercase tracking-[0.25em] text-cream"
        >
          Find order
        </button>
      </form>

      {searched && !order && (
        <p className="mt-10 text-sm text-ink/60">
          No order matches that number and email.
        </p>
      )}

      {order && (
        <div className="mt-12 border-t border-ink/10 pt-8">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-mono text-sm">{order.order_number}</span>
            <span className="text-[11px] uppercase tracking-[0.15em] text-gold">
              {order.status.replace("_", " ")}
            </span>
          </div>
          <ul className="mt-6 space-y-3 text-sm">
            {order.order_items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4">
                <span className="text-ink/70">
                  {i.product_name} — {i.size} × {i.qty}
                </span>
                <span>{formatINR(i.unit_price_paise * i.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex justify-between border-t border-ink/10 pt-4 text-base">
            <span>Total</span>
            <span>{formatINR(order.total_paise)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
