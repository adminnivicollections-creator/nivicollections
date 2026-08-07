import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/config";
import { trackShipment } from "@/lib/shiprocket";
import type { Order, OrderItem, OrderStatusHistory } from "@/lib/supabase/types";
import { updateOrder } from "../actions";
import { OrderForm } from "./OrderForm";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;

  const { data: order } = await createAdminClient()
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<Order & { order_items: OrderItem[] }>();

  if (!order) notFound();

  const a = order.shipping_address;
  const action = updateOrder.bind(null, order.id);

  const [shipment, { data: history }] = await Promise.all([
    order.tracking_number
      ? trackShipment(order.tracking_number).catch(() => null)
      : Promise.resolve(null),
    createAdminClient()
      .from("order_status_history")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true })
      .overrideTypes<OrderStatusHistory[]>(),
  ]);

  return (
    <div className="py-10">
      <Link
        href="/admin/orders"
        className="text-[11px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink"
      >
        ← All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-mono text-2xl text-ink">{order.order_number}</h2>
        <span className="text-[11px] uppercase tracking-[0.2em] text-gold">
          {order.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink/50">
        Placed {new Date(order.created_at).toLocaleString("en-IN")}
      </p>

      {(order.gift_wrap || order.notes) && (
        <div className="mt-4 max-w-2xl border border-gold/40 bg-blush/40 p-4 text-sm">
          {order.gift_wrap && (
            <p className="font-medium text-ink">🎁 Gift wrap requested</p>
          )}
          {order.notes && (
            <p className={order.gift_wrap ? "mt-2 text-ink/80" : "text-ink/80"}>
              &ldquo;{order.notes}&rdquo;
            </p>
          )}
        </div>
      )}

      <div className="mt-10 grid gap-12 md:grid-cols-[1fr_22rem]">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Items
          </h3>
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {order.order_items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-4 text-sm">
                <span>
                  {i.product_name}
                  <span className="block text-xs text-ink/50">
                    Size {i.size} × {i.qty}
                  </span>
                </span>
                <span>{formatINR(i.unit_price_paise * i.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/60">Subtotal</dt>
              <dd>{formatINR(order.subtotal_paise)}</dd>
            </div>
            {order.discount_paise > 0 && (
              <div className="flex justify-between text-gold">
                <dt>Discount ({order.coupon_code})</dt>
                <dd>−{formatINR(order.discount_paise)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink/60">Shipping</dt>
              <dd>
                {order.shipping_paise === 0
                  ? "Free"
                  : formatINR(order.shipping_paise)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-2 text-base">
              <dt>Total</dt>
              <dd>{formatINR(order.total_paise)}</dd>
            </div>
          </dl>

          <h3 className="mt-12 text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Ship to
          </h3>
          <address className="mt-4 text-sm not-italic leading-relaxed text-ink/80">
            {a.full_name}
            <br />
            {a.line1}
            {a.line2 && (
              <>
                <br />
                {a.line2}
              </>
            )}
            <br />
            {a.city}, {a.state} {a.pincode}
            <br />
            {a.country}
          </address>
          <p className="mt-4 text-sm text-ink/60">
            {order.email}
            <br />
            {order.phone}
          </p>

          {order.tracking_number && shipment?.found && (
            <div className="mt-8 border border-ink/10 p-4 text-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
                Live status via Shiprocket
              </p>
              <p className="mt-2 text-gold">{shipment.status}</p>
              {shipment.courierName && (
                <p className="mt-1 text-ink/60">{shipment.courierName}</p>
              )}
              {shipment.estimatedDelivery && !shipment.deliveredDate && (
                <p className="mt-1 text-ink/60">
                  ETA {shipment.estimatedDelivery}
                </p>
              )}
            </div>
          )}

          {order.razorpay_payment_id && (
            <p className="mt-8 text-xs text-ink/40">
              Razorpay payment: {order.razorpay_payment_id}
            </p>
          )}

          {history && history.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
                Timeline
              </h3>
              <ul className="mt-4 space-y-2 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex justify-between gap-4">
                    <span className="text-ink">{h.status.replace("_", " ")}</span>
                    <span className="text-ink/40">
                      {new Date(h.created_at).toLocaleString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <OrderForm action={action} order={order} />
      </div>
    </div>
  );
}
