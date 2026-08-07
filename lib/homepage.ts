import { createClient } from "./supabase/server";
import { imageUrl } from "./config";

export type HeroSlide = {
  id: string;
  imageUrl: string;
  linkHref: string | null;
};

/** Empty means no slides configured — the caller falls back to the bundled default banner. */
export async function getHomepageSlides(): Promise<HeroSlide[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("homepage_slides")
    .select("*")
    .order("position");

  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id,
    imageUrl: imageUrl(s.image_path),
    linkHref: s.link_href,
  }));
}
