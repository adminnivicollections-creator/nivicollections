import { createAdminClient } from "@/lib/supabase/admin";
import type { HomepageSlide } from "@/lib/supabase/types";
import { SlideManager } from "./SlideManager";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const { data: slides, error } = await createAdminClient()
    .from("homepage_slides")
    .select("*")
    .order("position")
    .overrideTypes<HomepageSlide[]>();

  if (error) throw error;

  return (
    <div className="py-10">
      <h2 className="font-serif text-2xl font-light text-ink">
        Homepage slides
      </h2>
      <p className="mt-1 max-w-xl text-sm text-ink/60">
        The banner at the top of your homepage. With two or more slides it
        auto-rotates, with arrows and dots to navigate manually. Each slide
        can link to a collection or product — leave blank to link to the
        shop. Recommended: a wide landscape photo, at least 1600px across.
      </p>

      <SlideManager slides={slides ?? []} />
    </div>
  );
}
