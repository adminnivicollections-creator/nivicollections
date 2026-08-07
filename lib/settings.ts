import { createClient } from "./supabase/server";
import type { StoreSettings } from "./supabase/types";

export async function getStoreSettings(): Promise<StoreSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", true)
    .single();

  if (error) throw error;
  return data;
}
