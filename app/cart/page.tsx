import { CartClient } from "./CartClient";
import { getStoreSettings } from "@/lib/settings";

export default async function CartPage() {
  const settings = await getStoreSettings();
  return (
    <CartClient
      freeShippingAbovePaise={settings.free_shipping_above_paise}
      flatShippingPaise={settings.flat_shipping_paise}
    />
  );
}
