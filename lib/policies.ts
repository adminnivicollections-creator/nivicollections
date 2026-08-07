import { BRAND, formatINR } from "./config";
import type { StoreSettings } from "./supabase/types";

export type Policy = {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
};

/** Slug + title only, for places like the footer that don't need live content. */
export const POLICY_META: { slug: string; title: string }[] = [
  { slug: "shipping", title: "Shipping Policy" },
  { slug: "refund", title: "Return, Cancellation and Refund Policy" },
  { slug: "privacy", title: "Privacy Policy" },
  { slug: "terms", title: "Terms and Conditions" },
];

/**
 * Built from live admin-editable settings rather than a static constant, so
 * changing the return window or address in /admin/settings actually changes
 * what these legally-relied-on pages say — a static copy would silently go
 * stale the moment an admin edited the real values elsewhere.
 */
export function buildPolicies(settings: StoreSettings): Policy[] {
  const free = formatINR(settings.free_shipping_above_paise);
  const flat = formatINR(settings.flat_shipping_paise);
  const window = settings.return_window_days;
  const email = settings.support_email || BRAND.email;
  const legalName = settings.legal_name || BRAND.legalName;

  return [
    {
      slug: "shipping",
      title: "Shipping Policy",
      summary: `We ship across India. Orders above ${free} ship free.`,
      sections: [
        {
          heading: "Where we ship",
          body: [
            `${legalName} ships to addresses across India. We do not ship internationally at this time.`,
          ],
        },
        {
          heading: "Charges",
          body: [
            `Shipping is free on orders with a cart value of ${free} or more.`,
            `Orders below ${free} carry a flat shipping charge of ${flat}, shown at checkout before payment.`,
          ],
        },
        {
          heading: "Dispatch time",
          body: [
            "Pieces marked \"Ready to Ship\" are dispatched within 2 to 3 working days of payment confirmation.",
            "Made-to-order pieces are dispatched within 3 to 4 weeks. The expected timeline is shown on each product page.",
            "Orders placed on Sundays and public holidays are processed the next working day.",
          ],
        },
        {
          heading: "Delivery time",
          body: [
            "Once dispatched, delivery typically takes 3 to 7 working days depending on your location. Remote pincodes may take longer.",
            "You will receive an email with your tracking number as soon as your parcel leaves us.",
          ],
        },
        {
          heading: "Delays",
          body: [
            "We are not responsible for delays caused by the courier, weather, strikes, or other circumstances outside our control. We will always help you follow up with the carrier.",
            `If your order has not arrived within 10 working days of dispatch, write to ${email} and we will trace it for you.`,
          ],
        },
        {
          heading: "Incorrect addresses",
          body: [
            "Please check your address and pincode carefully at checkout. Parcels returned to us because of an incorrect or incomplete address may attract a re-shipping charge.",
          ],
        },
      ],
    },

    {
      slug: "refund",
      title: "Return, Cancellation and Refund Policy",
      summary: `Returns accepted within ${window} days of delivery for unused pieces in original condition.`,
      sections: [
        {
          heading: "Cancellations",
          body: [
            "An order may be cancelled at no cost any time before it is dispatched. Write to us as soon as possible and we will confirm.",
            "Once an order has been dispatched it cannot be cancelled, but it may be returned under the conditions below.",
            "Made-to-order pieces cannot be cancelled once work has begun.",
          ],
        },
        {
          heading: "Returns",
          body: [
            `You may raise a return within ${window} days of delivery.`,
            "The piece must be unused and unwashed, with all original tags and packaging intact, and in a condition fit for resale.",
            "Sarees that have been stitched, altered, or had a fall or pico applied cannot be returned.",
            `To raise a return, write to ${email} with your order number and photographs of the piece.`,
          ],
        },
        {
          heading: "Pieces we cannot accept back",
          body: [
            "Items marked as final sale or clearance.",
            "Made-to-order and custom-stitched pieces, unless the item is defective or the wrong item was sent.",
            "Items returned after the return window, or without original tags and packaging.",
          ],
        },
        {
          heading: "Damaged or wrong items",
          body: [
            "If a piece arrives damaged, defective, or is not what you ordered, tell us within 48 hours of delivery with photographs. We will arrange a replacement or a full refund including shipping, at your choice.",
            "Please record an unboxing video where possible. It helps us settle courier claims quickly.",
          ],
        },
        {
          heading: "Refunds",
          body: [
            "Approved refunds are issued to the original payment method within 5 to 7 working days of us receiving and inspecting the returned piece.",
            "Depending on your bank, the amount may take a few additional days to appear on your statement.",
            "Shipping charges are refunded only where the return is due to our error.",
          ],
        },
        {
          heading: "Exchanges",
          body: [
            "We are happy to exchange a piece subject to availability. Raise a return as above and place a fresh order for the piece you would prefer.",
          ],
        },
      ],
    },

    {
      slug: "privacy",
      title: "Privacy Policy",
      summary: "What we collect, why, and what we never do with it.",
      sections: [
        {
          heading: "What we collect",
          body: [
            "When you place an order we collect your name, email address, phone number and shipping address. We need these to fulfil and deliver your order.",
            "If you create an account, we also store your order history and any addresses you save.",
            "If you join our mailing list, we store your email address until you ask us to remove it.",
          ],
        },
        {
          heading: "Payment information",
          body: [
            "We do not collect, see, or store your card, UPI or netbanking details. Payments are processed entirely by Razorpay, a PCI-DSS compliant payment gateway. We receive only a payment reference confirming whether a payment succeeded.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "To process, pack, ship and track your order.",
            "To send you order confirmations and dispatch updates.",
            "To answer your questions and resolve problems with an order.",
            "To send occasional emails about new pieces, only if you have opted in.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "Courier partners, so they can deliver your parcel.",
            "Razorpay, to process your payment.",
            "Our email provider, to send you transactional email.",
            "We do not sell, rent or trade your personal information to anybody, for any purpose.",
          ],
        },
        {
          heading: "Where it is stored",
          body: [
            "Your data is stored on managed cloud infrastructure with access restricted to the people who need it to run the shop. Access to customer records is protected by row-level security at the database itself, not only in the application.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We use cookies only to keep you signed in and to remember your cart between visits. We do not use advertising or cross-site tracking cookies.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            `You may ask us at any time to show you the data we hold about you, correct it, or delete it. Write to ${email} and we will act within 30 days.`,
            "You can unsubscribe from marketing email at any time using the link in any such email.",
          ],
        },
      ],
    },

    {
      slug: "terms",
      title: "Terms and Conditions",
      summary: "The terms on which we sell to you.",
      sections: [
        {
          heading: "About these terms",
          body: [
            `This website is operated by ${legalName}. By placing an order you agree to these terms.`,
            "We may update these terms from time to time. The version published here at the moment you place an order is the version that applies to it.",
          ],
        },
        {
          heading: "Products",
          body: [
            "Every piece is handcrafted. Slight variations in colour, weave and finish are inherent to handloom and block-printed textiles and are not defects.",
            "Screens render colour differently. We photograph pieces as faithfully as we can, but a small difference between the photograph and the piece is possible.",
            "Stock is limited and often a single piece. Adding an item to your cart does not reserve it; it is reserved only when payment succeeds.",
          ],
        },
        {
          heading: "Prices and payment",
          body: [
            "All prices are in Indian Rupees and inclusive of applicable taxes.",
            "We may change prices at any time, but never after you have paid for an order.",
            "Orders are confirmed only once payment is successfully captured. If payment fails, no order is created.",
            "We reserve the right to cancel and fully refund an order where an item is mispriced due to an obvious error, or where stock is unavailable.",
          ],
        },
        {
          heading: "Your account",
          body: [
            "You are responsible for keeping your account password confidential and for activity that takes place under your account.",
            "You may check out as a guest without creating an account.",
          ],
        },
        {
          heading: "Intellectual property",
          body: [
            `All photographs, text, designs and the ${legalName} name and logo on this website belong to us and may not be reproduced without written permission.`,
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "Our liability in connection with any order is limited to the amount you paid for that order.",
            "Nothing in these terms limits any right you have under the Consumer Protection Act, 2019 or other applicable Indian law.",
          ],
        },
        {
          heading: "Governing law",
          body: [
            "These terms are governed by the laws of India, and the courts of India shall have jurisdiction over any dispute.",
          ],
        },
      ],
    },
  ];
}

export function getPolicy(slug: string, settings: StoreSettings): Policy | undefined {
  return buildPolicies(settings).find((p) => p.slug === slug);
}
