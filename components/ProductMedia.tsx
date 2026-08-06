import Image from "next/image";
import { imageUrl } from "@/lib/config";
import type { ProductImage } from "@/lib/supabase/types";

// Falls back to a neutral block when a product has no photo yet, so the grid
// never collapses on a half-filled catalog.
export function ProductMedia({
  image,
  alt,
  className = "",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
}: {
  image?: ProductImage;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!image) {
    return (
      <div
        role="img"
        aria-label={`${alt} (photo coming soon)`}
        className={`flex items-center justify-center bg-blush ${className}`}
      >
        <span className="px-4 text-center font-serif text-[10px] uppercase tracking-[0.2em] text-ink/40">
          Photo coming soon
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-blush ${className}`}>
      <Image
        src={imageUrl(image.storage_path)}
        alt={image.alt || alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
