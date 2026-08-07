import { CheckoutForm } from "./CheckoutForm";
import { TrustBar } from "@/components/TrustBar";
import { getStoreSettings } from "@/lib/settings";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const settings = await getStoreSettings();

  return (
    <div className="min-h-dvh bg-[#0b0906] px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-4xl font-light text-[#f3e6cc]">
          Checkout
        </h1>
        <CheckoutForm
          freeShippingAbovePaise={settings.free_shipping_above_paise}
          flatShippingPaise={settings.flat_shipping_paise}
        />
        <div className="mt-16">
          <TrustBar
            dark
            returnWindowDays={settings.return_window_days}
            freeShippingAbovePaise={settings.free_shipping_above_paise}
          />
        </div>
      </div>
    </div>
  );
}
