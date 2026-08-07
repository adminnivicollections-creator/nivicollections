import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { data: settings, error } = await createAdminClient()
    .from("store_settings")
    .select("*")
    .eq("id", true)
    .single();

  if (error) throw error;

  return (
    <div className="py-10">
      <h2 className="font-serif text-2xl font-light text-ink">
        Store settings
      </h2>
      <p className="mt-1 max-w-xl text-sm text-ink/60">
        Drives the legal pages, the contact page, and the shipping fee
        actually charged at checkout.
      </p>
      <SettingsForm settings={settings} />
    </div>
  );
}
