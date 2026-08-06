import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { imageUrl } from "@/lib/config";
import { HeroUploadForm } from "./HeroUploadForm";
import { resetHomepageHero } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const { data: settings, error } = await createAdminClient()
    .from("homepage_settings")
    .select("hero_image_path")
    .eq("id", true)
    .maybeSingle();

  if (error) throw error;

  return (
    <div className="py-10">
      <h2 className="font-serif text-2xl font-light text-ink">
        Homepage photo
      </h2>
      <p className="mt-1 max-w-xl text-sm text-ink/60">
        The large banner at the top of your homepage. Recommended: a wide
        landscape photo, at least 1600px across.
      </p>

      <div className="mt-6 max-w-2xl">
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-blush">
          <Image
            src={
              settings?.hero_image_path
                ? imageUrl(settings.hero_image_path)
                : "/images/nivihomepage.png"
            }
            alt=""
            fill
            sizes="700px"
            className="object-cover"
          />
        </div>
        <p className="mt-2 text-xs text-ink/40">
          {settings?.hero_image_path
            ? "Currently showing the photo you uploaded."
            : "Currently showing the default photo — nothing uploaded yet."}
        </p>
      </div>

      <HeroUploadForm />

      {settings?.hero_image_path && (
        <form
          action={async () => {
            "use server";
            await resetHomepageHero();
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="text-xs uppercase tracking-[0.15em] text-red-700"
          >
            Reset to default photo
          </button>
        </form>
      )}
    </div>
  );
}
