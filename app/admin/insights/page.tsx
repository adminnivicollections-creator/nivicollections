import Link from "next/link";
import { getInsights } from "@/lib/insights";
import { formatINR } from "@/lib/config";
import type { ReturnReason } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<ReturnReason, string> = {
  defective: "Item was defective",
  wrong_item: "Wrong item received",
  changed_mind: "Changed their mind",
  other: "Other",
};

export default async function AdminInsightsPage() {
  const { restockAlerts, slowMovers, wishlistGaps, returnThemes } = await getInsights();

  return (
    <div className="py-10">
      <h1 className="font-serif text-2xl font-light text-ink">Insights</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/60">
        Plain-language read on what your sales data is telling you — no
        need to interpret charts, these are ready to act on.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Restock soon
          </h2>
          {restockAlerts.length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">
              Nothing selling fast enough to run out in the next week.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-sm">
              {restockAlerts.map((a) => (
                <li key={a.variantId} className="py-3">
                  <div className="flex justify-between">
                    <span>
                      {a.productName} — {a.size}
                    </span>
                    <span className="text-gold">
                      {a.daysOfStockLeft < 1
                        ? "runs out any day"
                        : `~${Math.round(a.daysOfStockLeft)} day${Math.round(a.daysOfStockLeft) === 1 ? "" : "s"} left`}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/40">
                    {a.stock} in stock, sold {a.soldInWindow} in the last 30 days
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Consider discounting
          </h2>
          {slowMovers.length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">
              Nothing sitting unsold for 60+ days right now.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-sm">
              {slowMovers.map((m) => (
                <li key={m.productId} className="py-3">
                  <div className="flex justify-between">
                    <Link
                      href={`/admin/products/${m.productId}`}
                      className="hover:text-gold"
                    >
                      {m.productName}
                    </Link>
                    <span className="text-ink/60">
                      {formatINR(m.stockValuePaise)} tied up
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/40">
                    {m.stockUnits} unit{m.stockUnits === 1 ? "" : "s"} in stock,{" "}
                    {m.daysSinceLastSale === null
                      ? "never sold"
                      : `last sold ${m.daysSinceLastSale} days ago`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Popular but not converting
          </h2>
          {wishlistGaps.length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">
              No wishlisted products with zero sales right now.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-sm">
              {wishlistGaps.map((w) => (
                <li key={w.productId} className="py-3">
                  <div className="flex justify-between">
                    <Link
                      href={`/admin/products/${w.productId}`}
                      className="hover:text-gold"
                    >
                      {w.productName}
                    </Link>
                    <span className="text-ink/60">
                      {w.wishlistCount} wishlisted
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/40">
                    Saved by shoppers but never bought — worth checking the
                    price or photos.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-ink/60">
            Why customers are returning items
          </h2>
          {returnThemes.totalReturns === 0 ? (
            <p className="mt-4 text-sm text-ink/50">
              No return requests in the last 60 days.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-sm">
              {returnThemes.byReason.map((r) => (
                <li key={r.reason} className="flex justify-between py-3">
                  <span>{REASON_LABEL[r.reason]}</span>
                  <span className="text-ink/60">
                    {r.count} of {returnThemes.totalReturns}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
