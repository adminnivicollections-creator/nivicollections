export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function gaPageView(path: string) {
  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: path });
}

export type GAItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
};

export function gaEvent(
  name: "add_to_cart" | "begin_checkout" | "purchase",
  params: {
    currency: "INR";
    value: number;
    items: GAItem[];
    transaction_id?: string;
  },
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
