import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/config";
import type { ReturnRequest } from "@/lib/supabase/types";
import { approveReturn, rejectReturn } from "./actions";
import { DecisionForm } from "./DecisionForm";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  defective: "Defective or damaged",
  wrong_item: "Wrong item received",
  changed_mind: "Changed mind",
  other: "Other",
};

type Row = ReturnRequest & {
  orders: { order_number: string; email: string; total_paise: number } | null;
};

export default async function AdminReturnsPage() {
  const admin = createAdminClient();

  // Not .overrideTypes<Row[]>() — postgrest-js's inference for the text[]
  // photo_paths column doesn't resolve to a plain string[], so a plain cast
  // after the fact is the reliable fix.
  const { data: requests, error } = (await admin
    .from("return_requests")
    .select("*, orders(order_number, email, total_paise)")
    .order("created_at", { ascending: false })) as {
    data: Row[] | null;
    error: { message: string } | null;
  };

  if (error) throw new Error(error.message);
  if (!requests) throw new Error("Could not load return requests.");

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  // Signed URLs, not public — return-photos is a private bucket.
  const allPaths = requests.flatMap((r) => r.photo_paths);
  const signedUrlByPath = new Map<string, string>();
  if (allPaths.length > 0) {
    const { data: signed } = await admin.storage
      .from("return-photos")
      .createSignedUrls(allPaths, 60 * 60);
    for (const s of signed ?? []) {
      if (s.signedUrl) signedUrlByPath.set(s.path ?? "", s.signedUrl);
    }
  }

  function Card({ r }: { r: Row }) {
    const approve = approveReturn.bind(null, r.id);
    const reject = rejectReturn.bind(null, r.id);

    return (
      <li className="border border-ink/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href={r.orders ? `/admin/orders` : "#"}
            className="font-mono text-xs text-ink hover:text-gold"
          >
            {r.orders?.order_number ?? "Order deleted"}
          </Link>
          <span
            className={
              r.status === "approved"
                ? "text-[11px] uppercase tracking-[0.15em] text-gold"
                : r.status === "rejected"
                  ? "text-[11px] uppercase tracking-[0.15em] text-red-700"
                  : "text-[11px] uppercase tracking-[0.15em] text-ink/40"
            }
          >
            {r.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-ink/60">{r.orders?.email}</p>
        {r.orders && (
          <p className="text-sm text-ink/60">{formatINR(r.orders.total_paise)}</p>
        )}
        <p className="mt-2 text-sm text-ink">{REASON_LABEL[r.reason]}</p>
        {r.description && (
          <p className="mt-1 text-sm text-ink/70">&ldquo;{r.description}&rdquo;</p>
        )}

        {r.photo_paths.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {r.photo_paths.map((p) => {
              const url = signedUrlByPath.get(p);
              return url ? (
                // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs, not worth next/image's remote-pattern config
                <img
                  key={p}
                  src={url}
                  alt="Return evidence"
                  className="h-20 w-20 object-cover"
                />
              ) : null;
            })}
          </div>
        )}

        <p className="mt-2 text-xs text-ink/40">
          {new Date(r.created_at).toLocaleString("en-IN")}
        </p>

        {r.status === "pending" ? (
          <DecisionForm approveAction={approve} rejectAction={reject} />
        ) : (
          r.admin_note && (
            <p className="mt-3 text-xs text-ink/50">Note: &ldquo;{r.admin_note}&rdquo;</p>
          )
        )}
      </li>
    );
  }

  return (
    <div className="py-10">
      <h2 className="font-serif text-2xl font-light text-ink">
        Needs review ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <p className="mt-4 text-ink/60">Nothing waiting on you.</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {pending.map((r) => (
            <Card key={r.id} r={r} />
          ))}
        </ul>
      )}

      {decided.length > 0 && (
        <>
          <h2 className="mt-16 font-serif text-2xl font-light text-ink">Decided</h2>
          <ul className="mt-6 space-y-6">
            {decided.map((r) => (
              <Card key={r.id} r={r} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
