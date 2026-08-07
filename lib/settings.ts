import { cache } from "react";
import { createClient } from "./supabase/server";
import type { StoreSettings } from "./supabase/types";

// Several independent parts of a single page render (layout, page, nested
// components) each need settings — cache() dedupes those into one query per
// request instead of one per caller.
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", true)
    .single();

  if (error) throw error;
  return data;
});
