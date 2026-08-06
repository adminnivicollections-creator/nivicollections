import Link from "next/link";

export const metadata = { title: "Order placed" };

// Deliberately shows nothing but the order number: this page is reachable by
// anyone with the link, so no address, email or totals appear here.
export default async function SuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const { order } = await searchParams;
  const orderNumber = typeof order === "string" ? order : null;

  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="font-serif text-4xl font-light text-ink">Thank you</h1>
      {orderNumber && (
        <p className="mt-6 text-ink/70">
          Your order is <span className="font-mono">{orderNumber}</span>.
        </p>
      )}
      <p className="mt-4 leading-relaxed text-ink/60">
        A confirmation email is on its way. We will write again as soon as your
        parcel is dispatched.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/orders/track"
          className="border border-ink px-8 py-4 text-[11px] uppercase tracking-[0.25em]"
        >
          Track this order
        </Link>
        <Link
          href="/"
          className="bg-ink px-8 py-4 text-[11px] uppercase tracking-[0.25em] text-cream"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
