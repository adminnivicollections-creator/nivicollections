"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "Catalog",
    links: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/products/new", label: "Add product" },
      { href: "/admin/categories", label: "Categories" },
    ],
  },
  {
    label: "Sales",
    links: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/returns", label: "Returns" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/coupons", label: "Coupons" },
    ],
  },
  {
    label: "Site",
    links: [
      { href: "/admin/homepage", label: "Homepage" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
  {
    label: "Engagement",
    links: [
      { href: "/admin/reviews", label: "Reviews" },
      { href: "/admin/questions", label: "Questions" },
      { href: "/admin/subscribers", label: "Launch list" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  // "/admin" itself would prefix-match every admin route, so it needs an
  // exact check; every other link is fine matching on its own subtree.
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex flex-wrap items-start gap-x-8 gap-y-4 text-[11px] uppercase tracking-[0.2em]">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-ink/40">{group.label}</p>
          <ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
            {group.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    isActive(link.href)
                      ? "text-gold"
                      : "text-ink/70 hover:text-ink"
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <p className="text-ink/40">&nbsp;</p>
        <Link href="/" className="mt-1.5 block text-ink/70 hover:text-ink">
          View shop
        </Link>
      </div>
    </nav>
  );
}
