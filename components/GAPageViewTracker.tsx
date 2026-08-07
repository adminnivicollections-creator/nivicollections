"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { gaPageView } from "@/lib/gtag";

// gtag's initial config call only sends one page_view, for the first load.
// The App Router's client-side navigations never trigger a full page load
// again, so without this, every product/collection browsed after the first
// page would be invisible in GA.
export function GAPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    gaPageView(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  return null;
}
