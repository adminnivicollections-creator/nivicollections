"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { imageUrl } from "@/lib/config";
import type { ProductImage } from "@/lib/supabase/types";

export function ProductGallery({
  images,
  alt,
  children,
}: {
  images: ProductImage[];
  alt: string;
  children?: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);

  const count = images.length;
  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Escape") setZoomed(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: Date.now(),
    };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.t;
    touchStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) || dt > 400) return;
    go(dx < 0 ? 1 : -1);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  if (count === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center bg-blush">
        <span className="px-4 text-center font-serif text-[10px] uppercase tracking-[0.2em] text-ink/40">
          Photo coming soon
        </span>
      </div>
    );
  }

  const current = images[index];

  return (
    <div>
      {/* Main image */}
      <div
        ref={trackRef}
        className="group relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden bg-blush select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setZoomed(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => zoomed && setZoomed(false)}
        style={
          zoomed
            ? {
                cursor: "zoom-out",
              }
            : undefined
        }
      >
        <Image
          key={current.id}
          src={imageUrl(current.storage_path)}
          alt={current.alt || alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={index === 0}
          className="object-cover transition-transform duration-200"
          style={
            zoomed
              ? {
                  transform: "scale(2.5)",
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }
              : undefined
          }
        />

        {/* Arrows — desktop only */}
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                setZoomed(false);
                go(-1);
              }}
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 bg-black/40 px-2.5 py-2 text-cream/80 opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100 md:block"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                setZoomed(false);
                go(1);
              }}
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 bg-black/40 px-2.5 py-2 text-cream/80 opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100 md:block"
            >
              ›
            </button>
          </>
        )}

        {/* Overlay icons (wishlist, share) */}
        {children && (
          <div
            className="absolute right-3 top-3 flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        )}

        {/* Dot indicators */}
        {count > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                aria-label={`Image ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed(false);
                  setIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-4 bg-[#c59e5a]"
                    : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Image counter */}
        {count > 1 && (
          <span className="absolute left-3 bottom-3 bg-black/50 px-2 py-0.5 text-[10px] text-white/70">
            {index + 1} / {count}
          </span>
        )}
      </div>

      {/* Thumbnails — desktop */}
      {count > 1 && (
        <div className="mt-3 hidden gap-2 md:flex">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => {
                setIndex(i);
                setZoomed(false);
              }}
              className={`relative aspect-square w-16 overflow-hidden transition-opacity ${
                i === index
                  ? "ring-1 ring-[#c59e5a]"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={imageUrl(img.storage_path)}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
