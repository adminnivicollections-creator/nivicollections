import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCategories } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { BRAND, COMING_SOON } from "@/lib/config";
import { headers } from "next/headers";

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
  icons: { icon: "/nivicollectionslogo-bg.png" },
  openGraph: {
    title: `${BRAND.legalName} | ${BRAND.tagline}`,
    description: "Handcrafted sarees. Launching soon.",
    images: ["/images/nivicollectionslaunchingsoon.png"],
    type: "website",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const [categories, { data: claims }, headerList] = await Promise.all([
    getCategories(),
    supabase.auth.getClaims(),
    headers(),
  ]);

  // The coming-soon page fills the viewport, so it gets no header or footer.
  // Every other route keeps the normal chrome, which is how you still reach
  // /admin and /login before launch. proxy.ts stamps x-pathname.
  const bare = COMING_SOON && headerList.get("x-pathname") === "/";

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider>
          {bare ? (
            children
          ) : (
            <>
              <Header
                categories={categories}
                signedIn={Boolean(claims?.claims)}
              />
              <main className="flex-1">{children}</main>
              <Footer categories={categories} />
            </>
          )}
        </CartProvider>
      </body>
    </html>
  );
}
