import "server-only";
import crypto from "node:crypto";

const API = "https://api.razorpay.com/v1";

function authHeader() {
  const id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Razorpay keys are not configured");
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

/** Creates a Razorpay order. `amountPaise` must come from the database. */
export async function createRazorpayOrder(opts: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string }> {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: "INR",
      receipt: opts.receipt,
      notes: opts.notes,
    }),
  });

  if (!res.ok) {
    throw new Error(`Razorpay order failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/**
 * Refunds part or all of a captured payment. Razorpay is the authority on
 * how much of a payment remains refundable — it rejects a request that
 * exceeds what's left on the payment, which is what actually protects
 * against a double-refund race, not anything on our side.
 */
export async function createRazorpayRefund(opts: {
  paymentId: string;
  amountPaise: number;
  notes?: Record<string, string>;
}): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API}/payments/${opts.paymentId}/refund`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: opts.amountPaise,
      speed: "normal",
      notes: opts.notes,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      message = JSON.parse(text)?.error?.description ?? text;
    } catch {
      // Not JSON — use the raw body.
    }
    throw new Error(message);
  }
  return res.json();
}

/**
 * Verifies a webhook body against the shared secret.
 * Timing-safe, and returns false rather than throwing on a malformed header.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
