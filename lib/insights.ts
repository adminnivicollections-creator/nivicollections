import { createAdminClient } from "@/lib/supabase/admin";
import { getViewsVsPurchases } from "@/lib/ga4";
import type {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  ReturnReason,
} from "@/lib/supabase/types";

const COUNTED = new Set(["paid", "packed", "shipped", "delivered"]);
const VELOCITY_WINDOW_DAYS = 30;
const SLOW_MOVER_DAYS = 60;
const RETURNS_WINDOW_DAYS = 60;
const MS_PER_DAY = 86_400_000;
// ponytail: bounded to the same recent-order window the dashboard already
// uses, rather than paginating full order history — good enough for
// velocity/last-sale signals, revisit if order volume grows a lot.
const ORDER_HISTORY_LIMIT = 500;
const MIN_VIEWS_FOR_SIGNAL = 20;
const LOW_CONVERSION_RATE = 0.02;

export type RestockAlert = {
  variantId: string;
  productName: string;
  size: string;
  stock: number;
  soldInWindow: number;
  daysOfStockLeft: number;
};

export type SlowMover = {
  productId: string;
  productName: string;
  stockUnits: number;
  stockValuePaise: number;
  daysSinceLastSale: number | null;
};

export type WishlistGap = {
  productId: string;
  productName: string;
  wishlistCount: number;
};

export type ReturnThemes = {
  totalReturns: number;
  byReason: { reason: ReturnReason; count: number }[];
};

export type HighViewsLowConversion = {
  itemId: string;
  itemName: string;
  views: number;
  purchases: number;
  conversionRate: number;
};

export type Insights = {
  restockAlerts: RestockAlert[];
  slowMovers: SlowMover[];
  wishlistGaps: WishlistGap[];
  returnThemes: ReturnThemes;
  // null when GA4 credentials aren't configured, as opposed to an empty
  // array once configured but nothing crosses the threshold.
  highViewsLowConversion: HighViewsLowConversion[] | null;
};

type VariantRow = ProductVariant & {
  products: Pick<Product, "id" | "name" | "active" | "price_paise" | "created_at"> | null;
};

type OrderRow = Pick<Order, "created_at" | "status"> & {
  order_items: Pick<OrderItem, "product_id" | "variant_id" | "product_name" | "qty">[];
};

type WishlistRow = {
  product_id: string;
  products: Pick<Product, "id" | "name" | "active"> | null;
};

export async function getInsights(): Promise<Insights> {
  const admin = createAdminClient();
  const now = Date.now();
  const windowStart = now - VELOCITY_WINDOW_DAYS * MS_PER_DAY;

  const [
    { data: variants, error: variantsError },
    { data: orders, error: ordersError },
    { data: wishlists, error: wishlistError },
    { data: returns, error: returnsError },
    ga4Rows,
  ] = await Promise.all([
    admin
      .from("product_variants")
      .select("*, products(id, name, active, price_paise, created_at)")
      .overrideTypes<VariantRow[]>(),
    admin
      .from("orders")
      .select("created_at, status, order_items(product_id, variant_id, product_name, qty)")
      .order("created_at", { ascending: false })
      .limit(ORDER_HISTORY_LIMIT)
      .overrideTypes<OrderRow[]>(),
    admin
      .from("wishlists")
      .select("product_id, products(id, name, active)")
      .overrideTypes<WishlistRow[]>(),
    admin
      .from("return_requests")
      .select("reason, created_at")
      .gte("created_at", new Date(now - RETURNS_WINDOW_DAYS * MS_PER_DAY).toISOString()),
    getViewsVsPurchases(),
  ]);

  if (variantsError) throw variantsError;
  if (ordersError) throw ordersError;
  if (wishlistError) throw wishlistError;
  if (returnsError) throw returnsError;

  const soldItems = (orders ?? [])
    .filter((o) => COUNTED.has(o.status))
    .flatMap((o) => o.order_items.map((item) => ({ ...item, orderCreatedAt: o.created_at })));

  const soldInWindowByVariant = new Map<string, number>();
  const lastSaleByProduct = new Map<string, string>();
  const unitsSoldByProduct = new Map<string, number>();

  for (const item of soldItems) {
    if (item.product_id) {
      unitsSoldByProduct.set(
        item.product_id,
        (unitsSoldByProduct.get(item.product_id) ?? 0) + item.qty,
      );
      const prevLast = lastSaleByProduct.get(item.product_id);
      if (!prevLast || item.orderCreatedAt > prevLast) {
        lastSaleByProduct.set(item.product_id, item.orderCreatedAt);
      }
    }
    if (item.variant_id && new Date(item.orderCreatedAt).getTime() >= windowStart) {
      soldInWindowByVariant.set(
        item.variant_id,
        (soldInWindowByVariant.get(item.variant_id) ?? 0) + item.qty,
      );
    }
  }

  const restockAlerts: RestockAlert[] = (variants ?? [])
    .filter((v) => v.products?.active && v.stock > 0)
    .map((v) => {
      const soldInWindow = soldInWindowByVariant.get(v.id) ?? 0;
      const dailyRate = soldInWindow / VELOCITY_WINDOW_DAYS;
      const daysOfStockLeft = dailyRate > 0 ? v.stock / dailyRate : Infinity;
      return {
        variantId: v.id,
        productName: v.products!.name,
        size: v.size,
        stock: v.stock,
        soldInWindow,
        daysOfStockLeft,
      };
    })
    .filter((a) => a.soldInWindow > 0 && a.daysOfStockLeft <= 7)
    .sort((a, b) => a.daysOfStockLeft - b.daysOfStockLeft)
    .slice(0, 8);

  const stockByProduct = new Map<string, { units: number; product: VariantRow["products"] }>();
  for (const v of variants ?? []) {
    if (!v.products?.active) continue;
    const entry = stockByProduct.get(v.products.id) ?? { units: 0, product: v.products };
    entry.units += v.stock;
    stockByProduct.set(v.products.id, entry);
  }

  const slowMovers: SlowMover[] = [...stockByProduct.values()]
    .filter((e) => e.units > 0 && e.product)
    .map((e) => {
      const product = e.product!;
      const lastSale = lastSaleByProduct.get(product.id);
      const listedDaysAgo = (now - new Date(product.created_at).getTime()) / MS_PER_DAY;
      const daysSinceLastSale = lastSale
        ? (now - new Date(lastSale).getTime()) / MS_PER_DAY
        : listedDaysAgo;
      return {
        productId: product.id,
        productName: product.name,
        stockUnits: e.units,
        stockValuePaise: e.units * product.price_paise,
        daysSinceLastSale: lastSale ? Math.round(daysSinceLastSale) : null,
      };
    })
    .filter((m) => m.daysSinceLastSale === null || m.daysSinceLastSale >= SLOW_MOVER_DAYS)
    .filter((m) => {
      // A never-sold product only counts once it's actually been listed
      // long enough to call "slow" — otherwise every new listing would
      // show up on day one.
      const p = stockByProduct.get(m.productId)!.product!;
      return now - new Date(p.created_at).getTime() >= SLOW_MOVER_DAYS * MS_PER_DAY;
    })
    .sort((a, b) => b.stockValuePaise - a.stockValuePaise)
    .slice(0, 8);

  const wishlistCounts = new Map<string, { count: number; name: string }>();
  for (const w of wishlists ?? []) {
    const product = w.products;
    if (!product?.active) continue;
    const entry = wishlistCounts.get(product.id) ?? { count: 0, name: product.name };
    entry.count += 1;
    wishlistCounts.set(product.id, entry);
  }

  const wishlistGaps: WishlistGap[] = [...wishlistCounts.entries()]
    .filter(([productId, e]) => e.count >= 3 && (unitsSoldByProduct.get(productId) ?? 0) === 0)
    .map(([productId, e]) => ({
      productId,
      productName: e.name,
      wishlistCount: e.count,
    }))
    .sort((a, b) => b.wishlistCount - a.wishlistCount)
    .slice(0, 8);

  const reasonCounts = new Map<ReturnReason, number>();
  for (const r of returns ?? []) {
    const reason = r.reason as ReturnReason;
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }
  const returnThemes: ReturnThemes = {
    totalReturns: returns?.length ?? 0,
    byReason: [...reasonCounts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };

  const highViewsLowConversion: HighViewsLowConversion[] | null =
    ga4Rows === null
      ? null
      : ga4Rows
          .filter((r) => r.itemId && r.views >= MIN_VIEWS_FOR_SIGNAL)
          .map((r) => ({ ...r, conversionRate: r.purchases / r.views }))
          .filter((r) => r.conversionRate < LOW_CONVERSION_RATE)
          .sort((a, b) => b.views - a.views)
          .slice(0, 8);

  return {
    restockAlerts,
    slowMovers,
    wishlistGaps,
    returnThemes,
    highViewsLowConversion,
  };
}
