import type { Metadata } from "next";
import { Suspense } from "react";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCategories } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/settings";
import { BRAND } from "@/lib/config";
import { BottomNav } from "@/components/BottomNav";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CartDrawer } from "@/components/CartDrawer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { GAPageViewTracker } from "@/components/GAPageViewTracker";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // `||` deliberately, not `??` — an env var set to an empty string (as
  // opposed to unset) must still fall back, or new URL("") crashes the
  // entire build with no indication why.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: `${BRAND.legalName} | Handcrafted Indian Occasion Wear`,
    template: `%s | ${BRAND.legalName}`,
  },
  description:
    "Limited-run lehengas, sarees, kurta sets and gowns, handcrafted by artisans across India.",
  icons: { icon: "/images/nivicollectionslogo-bg.png" },
  openGraph: {
    title: `${BRAND.legalName} | ${BRAND.tagline}`,
    description: "Handwoven sarees for every occasion, made in limited runs.",
    images: ["/images/nivihomepage.png"],
    type: "website",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const [categories, { data: claims }, settings] = await Promise.all([
    getCategories(),
    supabase.auth.getClaims(),
    getStoreSettings(),
  ]);
  const signedIn = Boolean(claims?.claims);
  const shopHref = categories[0]
    ? `/collections/${categories[0].slug}`
    : "/cart";

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <GAPageViewTracker />
        </Suspense>
        <CartProvider>
          <Header categories={categories} signedIn={signedIn} />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer categories={categories} />
          <BottomNav shopHref={shopHref} signedIn={signedIn} />
          <WhatsAppButton phone={settings.support_phone} />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
