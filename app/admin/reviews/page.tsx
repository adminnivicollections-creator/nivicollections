import Link from "next/link";
import { getAllReviews } from "@/lib/reviews";
import { setReviewStatus, replyToReview } from "./actions";
import { ReplyForm } from "./ReplyForm";

export const dynamic = "force-dynamic";

const STARS = "★★★★★";

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();
  const pending = reviews.filter((r) => r.status === "pending");
  const decided = reviews.filter((r) => r.status !== "pending");

  return (
    <div className="py-10">
      <h2 className="font-serif text-2xl font-light text-ink">
        Needs moderation ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <p className="mt-4 text-ink/60">Nothing waiting on you.</p>
      ) : (
        <ul className="mt-6 space-y-8">
          {pending.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </ul>
      )}

      {decided.length > 0 && (
        <>
          <h2 className="mt-16 font-serif text-2xl font-light text-ink">
            Reviewed
          </h2>
          <ul className="mt-6 space-y-8">
            {decided.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ReviewCard({
  review: r,
}: {
  review: Awaited<ReturnType<typeof getAllReviews>>[number];
}) {
  const approve = setReviewStatus.bind(null, r.id, "approved");
  const reject = setReviewStatus.bind(null, r.id, "rejected");
  const reply = replyToReview.bind(null, r.id);

  return (
    <li className="border border-ink/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/products/${r.productSlug}`}
          className="text-[11px] uppercase tracking-[0.2em] text-gold"
        >
          {r.productName}
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
      <p className="mt-2 text-sm text-ink/60" aria-hidden>
        {STARS.slice(0, r.rating)}
        <span className="text-ink/20">{STARS.slice(r.rating)}</span>
      </p>
      {r.title && <p className="mt-1 font-medium text-ink">{r.title}</p>}
      {r.body && <p className="mt-1 text-sm text-ink/80">{r.body}</p>}
      <p className="mt-1 text-xs text-ink/40">
        {r.reviewerName} · {new Date(r.created_at).toLocaleDateString("en-IN")}
      </p>

      <div className="mt-3 flex gap-4">
        <form action={approve}>
          <button
            type="submit"
            disabled={r.status === "approved"}
            className="text-xs uppercase tracking-[0.15em] text-gold disabled:opacity-30"
          >
            Approve
          </button>
        </form>
        <form action={reject}>
          <button
            type="submit"
            disabled={r.status === "rejected"}
            className="text-xs uppercase tracking-[0.15em] text-red-700 disabled:opacity-30"
          >
            Reject
          </button>
        </form>
      </div>

      <ReplyForm action={reply} defaultValue={r.admin_reply ?? ""} />
    </li>
  );
}
