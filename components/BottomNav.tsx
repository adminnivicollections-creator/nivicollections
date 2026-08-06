"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

const ICONS = {
  home: (
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z" />
  ),
  shop: (
    <path d="M4 8h16l-1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L4 8Zm2-1V6a6 6 0 0 1 12 0v1" />
  ),
  heart: (
    <path d="M12 21s-7.5-4.6-10-9.1C.5 8.5 2 5 5.5 5c2 0 3.5 1.2 4.5 2.7C11 6.2 12.5 5 14.5 5 18 5 19.5 8.5 22 11.9 19.5 16.4 12 21 12 21Z" />
  ),
  bag: (
    <path d="M6 8h12l1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L6 8Zm3-1V6a3 3 0 0 1 6 0v1" />
  ),
  user: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" />
  ),
};

function TabIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  );
}

export function BottomNav({
  shopHref,
  signedIn,
}: {
  shopHref: string;
  signedIn: boolean;
}) {
  const pathname = usePathname();
  const { count, hydrated } = useCart();

  // /admin has its own layout and its own navigation; the shopper tab bar
  // has no business appearing over it.
  if (pathname.startsWith("/admin")) return null;

  const tabs: { href: string; label: string; icon: keyof typeof ICONS }[] = [
    { href: "/", label: "Home", icon: "home" },
    { href: shopHref, label: "Shop", icon: "shop" },
    { href: "/account/wishlist", label: "Wishlist", icon: "heart" },
    { href: "/cart", label: "Cart", icon: "bag" },
    { href: signedIn ? "/account" : "/login", label: "Account", icon: "user" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#c59e5a]/20 bg-[#0b0906] pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-between px-2">
        {tabs.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.label} className="flex-1">
              <Link
                href={tab.href}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] uppercase tracking-wider ${
                  active ? "text-[#c59e5a]" : "text-[#f3e6cc]/50"
                }`}
              >
                <TabIcon name={tab.icon} />
                {tab.label}
                {tab.icon === "bag" && hydrated && count > 0 && (
                  <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c59e5a] px-1 text-[9px] font-medium text-[#0b0906]">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
