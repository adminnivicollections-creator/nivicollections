import { getProductReviews, getReviewSummary, getReviewableOrderItems } from "@/lib/reviews";
import { Stars } from "@/components/Stars";
import { ReviewForm } from "./ReviewForm";

export async function Reviews({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const [summary, reviews, reviewable] = await Promise.all([
    getReviewSummary(productId),
    getProductReviews(productId),
    getReviewableOrderItems(productId),
  ]);

  return (
    <section id="reviews" className="mt-28 border-t border-[#c59e5a]/20 pt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-serif text-3xl font-light text-[#f3e6cc]">
          Reviews
        </h2>
        {summary.count > 0 && (
          <p className="flex items-center gap-2 text-sm text-[#f3e6cc]/70">
            <Stars value={summary.average} size={16} />
            {summary.average.toFixed(1)} · {summary.count}{" "}
            {summary.count === 1 ? "review" : "reviews"}
          </p>
        )}
      </div>

      {reviewable.length > 0 && (
        <ReviewForm
          productId={productId}
          slug={slug}
          orderItems={reviewable}
        />
      )}

      {reviews.length === 0 ? (
        <p className="mt-8 text-sm text-[#f3e6cc]/50">
          No reviews yet. Reviews appear here once a verified buyer&apos;s
          order has been delivered.
        </p>
      ) : (
        <ul className="mt-10 space-y-8">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-[#c59e5a]/15 pb-8">
              <div className="flex items-center gap-3">
                <Stars value={r.rating} />
                <span className="text-sm text-[#f3e6cc]">
                  {r.reviewerName}
                </span>
                <span className="text-xs text-[#f3e6cc]/40">
                  {new Date(r.created_at).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {r.title && (
                <p className="mt-2 font-serif text-base text-[#f3e6cc]">
                  {r.title}
                </p>
              )}
              {r.body && (
                <p className="mt-1 text-sm leading-relaxed text-[#f3e6cc]/70">
                  {r.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
