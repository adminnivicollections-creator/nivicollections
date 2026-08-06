"use client";

import { useState, useTransition } from "react";
import { toggleWishlist } from "@/lib/wishlist";
import { useRouter } from "next/navigation";

export function WishlistHeart({
  productId,
  initialWishlisted,
  path,
  className = "",
}: {
  productId: string;
  initialWishlisted: boolean;
  path: string;
  className?: string;
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Optimistic: most toggles succeed, and an unauthenticated user
        // simply gets bounced to sign in rather than seeing a flash of state.
        const next = !wishlisted;
        setWishlisted(next);
        startTransition(async () => {
          const result = await toggleWishlist(productId, path);
          if ("error" in result) {
            setWishlisted(!next);
            router.push(`/login?next=${encodeURIComponent(path)}`);
          } else {
            setWishlisted(result.wishlisted);
          }
        });
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-ink shadow-sm transition-transform active:scale-90 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        className={wishlisted ? "text-gold" : "text-ink/70"}
      >
        <path d="M12 21s-7.5-4.6-10-9.1C.5 8.5 2 5 5.5 5c2 0 3.5 1.2 4.5 2.7C11 6.2 12.5 5 14.5 5 18 5 19.5 8.5 22 11.9 19.5 16.4 12 21 12 21Z" />
      </svg>
    </button>
  );
}
