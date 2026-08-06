import { createClient } from "./supabase/server";
import { imageUrl } from "./config";

/** Null means the bundled default image in /public/images should be used. */
export async function getHomepageHeroUrl(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("homepage_settings")
    .select("hero_image_path")
    .eq("id", true)
    .maybeSingle();

  if (error) throw error;
  return data?.hero_image_path ? imageUrl(data.hero_image_path) : null;
}
