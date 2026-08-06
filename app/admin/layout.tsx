import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./AdminNav";

export const metadata = { title: "Admin" };

// Every /admin route is gated here. proxy.ts only checks that someone is
// signed in; the role check must happen server-side, and this is it.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-ink/10 pb-6">
        <h1 className="font-serif text-3xl font-light text-ink">Admin</h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
