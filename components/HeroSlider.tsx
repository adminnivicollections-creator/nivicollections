"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { HeroSlide } from "@/lib/homepage";

const AUTOPLAY_MS = 5000;

export function HeroSlider({
  slides,
  fallbackHref,
}: {
  slides: HeroSlide[];
  fallbackHref: string;
}) {
  const [index, setIndex] = useState(0);
  const multi = slides.length > 1;

  useEffect(() => {
    if (!multi) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [multi, slides.length]);

  const slide = slides[index];
  if (!slide) return null;

  return (
    <div className="relative">
      <Link href={slide.linkHref || fallbackHref} className="block">
        <div className="relative aspect-[3/2] w-full sm:aspect-[16/7]">
          <Image
            src={slide.imageUrl}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </Link>

      {multi && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#0b0906]/50 text-[#f3e6cc] hover:bg-[#0b0906]/70"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#0b0906]/50 text-[#f3e6cc] hover:bg-[#0b0906]/70"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 w-6 transition-colors ${
                  i === index ? "bg-[#c59e5a]" : "bg-[#f3e6cc]/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
