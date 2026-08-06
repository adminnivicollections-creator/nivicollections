import "server-only";
import { createAdminClient } from "./supabase/admin";
import { BRAND, formatINR } from "./config";
import type { Order, OrderItem } from "./supabase/types";

/**
 * Sends the order confirmation. A missing RESEND_API_KEY is logged and
 * skipped rather than thrown, so a store can take orders before email is set up.
 */
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("RESEND_API_KEY or ORDER_EMAIL_FROM unset — skipping email");
    return;
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .maybeSingle()
    .overrideTypes<Order & { order_items: OrderItem[] }>();

  if (error) throw error;
  if (!order) throw new Error(`Order ${orderId} not found`);

  const rows = order.order_items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0">${escapeHtml(i.product_name)} — ${escapeHtml(i.size)} × ${i.qty}</td>
        <td style="padding:8px 0;text-align:right">${formatINR(i.unit_price_paise * i.qty)}</td>
      </tr>`,
    )
    .join("");

  const a = order.shipping_address;
  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;color:#241f1b">
      <h1 style="font-weight:400;letter-spacing:.2em;text-transform:uppercase;font-size:18px">
        ${escapeHtml(BRAND.name)}
      </h1>
      <p>Thank you for your order.</p>
      <p style="color:#666">Order <strong>${escapeHtml(order.order_number)}</strong></p>
      <table style="width:100%;border-top:1px solid #ddd;border-bottom:1px solid #ddd;margin:16px 0">
        ${rows}
      </table>
      <table style="width:100%">
        <tr><td>Subtotal</td><td style="text-align:right">${formatINR(order.subtotal_paise)}</td></tr>
        ${
          order.discount_paise > 0
            ? `<tr><td>Discount (${escapeHtml(order.coupon_code)})</td><td style="text-align:right">−${formatINR(order.discount_paise)}</td></tr>`
            : ""
        }
        <tr><td>Shipping</td><td style="text-align:right">${
          order.shipping_paise === 0 ? "Free" : formatINR(order.shipping_paise)
        }</td></tr>
        <tr><td><strong>Total</strong></td><td style="text-align:right"><strong>${formatINR(order.total_paise)}</strong></td></tr>
      </table>
      <p style="color:#666;margin-top:24px">Shipping to:<br>
        ${escapeHtml(a.full_name)}<br>
        ${escapeHtml(a.line1)}${a.line2 ? `<br>${escapeHtml(a.line2)}` : ""}<br>
        ${escapeHtml(a.city)}, ${escapeHtml(a.state)} ${escapeHtml(a.pincode)}
      </p>
      <p style="color:#666;font-size:12px">Questions? Reply to this email or write to ${escapeHtml(BRAND.email)}.</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${BRAND.name} <${from}>`,
      to: [order.email],
      subject: `Order ${order.order_number} confirmed`,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend failed (${res.status}): ${await res.text()}`);
  }
}

/** Tells the customer their parcel is on its way. */
export async function sendShippingNotice(orderId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("RESEND_API_KEY or ORDER_EMAIL_FROM unset — skipping email");
    return;
  }

  const { data: order, error } = await createAdminClient()
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!order) throw new Error(`Order ${orderId} not found`);

  const tracking = order.tracking_number
    ? `<p>Tracking number: <strong>${escapeHtml(order.tracking_number)}</strong>${
        order.carrier ? ` (${escapeHtml(order.carrier)})` : ""
      }</p>`
    : "";

  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;color:#241f1b">
      <h1 style="font-weight:400;letter-spacing:.2em;text-transform:uppercase;font-size:18px">
        ${escapeHtml(BRAND.name)}
      </h1>
      <p>Your order <strong>${escapeHtml(order.order_number)}</strong> has been dispatched.</p>
      ${tracking}
      <p style="color:#666;font-size:12px">Questions? Write to ${escapeHtml(BRAND.email)}.</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${BRAND.name} <${from}>`,
      to: [order.email],
      subject: `Order ${order.order_number} is on its way`,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend failed (${res.status}): ${await res.text()}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
