import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/config";
import { CouponForm } from "./CouponForm";
import { setCouponActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const { data: coupons, error } = await createAdminClient()
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="py-10">
      <h2 className="font-serif text-2xl font-light text-ink">
        Add a coupon
      </h2>
      <CouponForm />

      <h2 className="mt-16 font-serif text-2xl font-light text-ink">
        All coupons
      </h2>
      {coupons.length === 0 ? (
        <p className="mt-6 text-ink/60">No coupons yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-[11px] uppercase tracking-[0.15em] text-ink/50">
              <tr>
                <th className="py-3 pr-4 font-normal">Code</th>
                <th className="py-3 pr-4 font-normal">Discount</th>
                <th className="py-3 pr-4 font-normal">Min. cart</th>
                <th className="py-3 pr-4 font-normal">Used</th>
                <th className="py-3 pr-4 font-normal">Expires</th>
                <th className="py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="py-4 pr-4 font-mono">{c.code}</td>
                  <td className="py-4 pr-4">
                    {c.discount_type === "percent"
                      ? `${c.discount_value}%`
                      : formatINR(c.discount_value)}
                  </td>
                  <td className="py-4 pr-4 text-ink/60">
                    {c.min_subtotal_paise > 0
                      ? formatINR(c.min_subtotal_paise)
                      : "—"}
                  </td>
                  <td className="py-4 pr-4 text-ink/60">
                    {c.times_redeemed}
                    {c.max_redemptions ? ` / ${c.max_redemptions}` : ""}
                  </td>
                  <td className="py-4 pr-4 text-ink/60">
                    {c.expires_at
                      ? new Date(c.expires_at).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td className="py-4">
                    <form
                      action={async () => {
                        "use server";
                        await setCouponActive(c.id, !c.active);
                      }}
                    >
                      <button
                        type="submit"
                        className={
                          c.active
                            ? "text-gold"
                            : "text-ink/40 hover:text-ink"
                        }
                      >
                        {c.active ? "Active" : "Disabled"}
                      </button>
                    </form>
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
