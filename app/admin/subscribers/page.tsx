import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const { data: subscribers, error } = await createAdminClient()
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl font-light text-ink">
          Launch list
        </h2>
        <span className="text-sm text-ink/50">
          {subscribers.length} {subscribers.length === 1 ? "person" : "people"}
        </span>
      </div>

      {subscribers.length === 0 ? (
        <p className="py-20 text-center text-ink/60">No signups yet.</p>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {subscribers.map((s) => (
              <li key={s.id} className="flex justify-between gap-4 py-3 text-sm">
                <span>{s.email}</span>
                <span className="text-ink/50">
                  {new Date(s.created_at).toLocaleDateString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
          <details className="mt-8">
            <summary className="cursor-pointer text-[11px] uppercase tracking-[0.2em] text-gold">
              Copy all addresses
            </summary>
            <textarea
              readOnly
              rows={4}
              className="mt-3 w-full border border-ink/20 bg-transparent p-3 text-xs"
              value={subscribers.map((s) => s.email).join(", ")}
            />
          </details>
        </>
      )}
    </div>
  );
}
