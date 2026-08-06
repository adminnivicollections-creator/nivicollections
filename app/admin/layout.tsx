import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin" };

// Every /admin route is gated here. proxy.ts only checks that someone is
// signed in; the role check must happen server-side, and this is it.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-6">
        <h1 className="font-serif text-3xl font-light text-ink">Admin</h1>
        <nav className="flex gap-6 text-[11px] uppercase tracking-[0.2em]">
          <Link href="/admin" className="text-ink/70 hover:text-ink">
            Products
          </Link>
          <Link href="/admin/products/new" className="text-ink/70 hover:text-ink">
            Add product
          </Link>
          <Link href="/admin/orders" className="text-ink/70 hover:text-ink">
            Orders
          </Link>
          <Link href="/admin/subscribers" className="text-ink/70 hover:text-ink">
            Launch list
          </Link>
          <Link href="/admin/coupons" className="text-ink/70 hover:text-ink">
            Coupons
          </Link>
          <Link href="/" className="text-ink/70 hover:text-ink">
            View shop
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
