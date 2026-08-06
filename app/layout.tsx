import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCategories } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/config";

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
  title: {
    default: `${BRAND.legalName} | Handcrafted Indian Occasion Wear`,
    template: `%s | ${BRAND.legalName}`,
  },
  description:
    "Limited-run lehengas, sarees, kurta sets and gowns, handcrafted by artisans across India.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const [categories, { data: claims }] = await Promise.all([
    getCategories(),
    supabase.auth.getClaims(),
  ]);

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <Header categories={categories} signedIn={Boolean(claims?.claims)} />
          <main className="flex-1">{children}</main>
          <Footer categories={categories} />
        </CartProvider>
      </body>
    </html>
  );
}
