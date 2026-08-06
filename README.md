# Nivi Collections

A premium clothing storefront built with Next.js 16 (App Router), TypeScript and Tailwind v4.

```bash
npm run dev
```

Open <http://localhost:3000>.

## What exists

| Route | What it does |
|---|---|
| `/` | Split hero, collection tiles, "Just In" grid |
| `/collections/[slug]` | Category grid, one per entry in `CATEGORIES` |
| `/products/[slug]` | Gallery, size picker, add to cart, related pieces |
| `/cart` | Line items, quantity, remove, subtotal (persisted in localStorage) |
| `/checkout` | Placeholder — no payment gateway connected yet |

## Swapping in your real content

Everything lives in **[`lib/products.ts`](lib/products.ts)** — edit `CATEGORIES` and the `raw` product array. Slugs are generated from product names automatically.

**Product photos:** there are none yet. `components/PlaceholderImage.tsx` renders a gradient block using the `swatch` index on each product. To use real photos, drop them in `public/`, add an `image` field to `Product`, and replace `<PlaceholderImage>` with `next/image` in `ProductCard`, the product page, and the cart.

**Brand name and colours:** the wordmark is in `components/Header.tsx` and `components/Footer.tsx`. Colours and fonts are the `@theme` tokens at the top of `app/globals.css` (`cream`, `ink`, `gold`, `blush`).

## Not built yet

- Payments — `/checkout` is a stub. Razorpay or Stripe goes here once the business account exists.
- Real inventory — `soldOut` and stock are static fields in the product file, not a database.
- Search, filters, accounts, order history, admin.
