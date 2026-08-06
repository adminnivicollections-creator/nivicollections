import Link from "next/link";
import { BRAND, BUSINESS } from "@/lib/config";

export const metadata = {
  title: "Contact Us",
  description: `Reach ${BRAND.legalName} by email or phone.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-serif text-4xl font-light text-ink">Contact Us</h1>
      <p className="mt-3 text-ink/60">
        We answer every message, usually the same working day.
      </p>

      <dl className="mt-12 space-y-8">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-gold">
            Email
          </dt>
          <dd className="mt-2">
            <a href={`mailto:${BRAND.email}`} className="text-ink underline">
              {BRAND.email}
            </a>
          </dd>
        </div>

        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-gold">
            Phone
          </dt>
          <dd className="mt-2 text-ink">{BUSINESS.phone}</dd>
        </div>

        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-gold">
            Hours
          </dt>
          <dd className="mt-2 text-ink">{BRAND.supportHours}</dd>
        </div>

        <div>
          <dt className="text-[11px] uppercase tracking-[0.2em] text-gold">
            Registered address
          </dt>
          <dd className="mt-2 whitespace-pre-line text-ink">
            {BUSINESS.legalEntity}
            {"\n"}
            {BUSINESS.address}
          </dd>
        </div>

        {BUSINESS.gstin && (
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-gold">
              GSTIN
            </dt>
            <dd className="mt-2 text-ink">{BUSINESS.gstin}</dd>
          </div>
        )}
      </dl>

      <p className="mt-14 text-sm text-ink/60">
        Chasing a parcel?{" "}
        <Link href="/orders/track" className="text-gold underline">
          Track your order
        </Link>{" "}
        with your order number and email.
      </p>
    </div>
  );
}
