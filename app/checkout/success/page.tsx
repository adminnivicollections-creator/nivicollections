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
    <div className="min-h-dvh bg-[#0b0906] px-5 py-32 text-center">
      <h1 className="font-serif text-4xl font-light text-[#f3e6cc]">
        Thank you
      </h1>
      {orderNumber && (
        <p className="mt-6 text-[#f3e6cc]/70">
          Your order is <span className="font-mono">{orderNumber}</span>.
        </p>
      )}
      <p className="mt-4 leading-relaxed text-[#f3e6cc]/60">
        A confirmation email is on its way. We will write again as soon as your
        parcel is dispatched.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/orders/track"
          className="border border-[#c59e5a] px-8 py-4 text-[11px] uppercase tracking-[0.25em] text-[#f3e6cc]"
        >
          Track this order
        </Link>
        <Link
          href="/"
          className="bg-[#c59e5a] px-8 py-4 text-[11px] uppercase tracking-[0.25em] text-[#0b0906]"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
