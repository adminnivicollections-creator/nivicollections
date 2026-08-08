import { BetaAnalyticsDataClient } from "@google-analytics/data";

const propertyId = process.env.GA4_PROPERTY_ID;
const clientEmail = process.env.GA4_CLIENT_EMAIL;
const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");

export type ProductViewsAndPurchases = {
  itemId: string;
  itemName: string;
  views: number;
  purchases: number;
};

/**
 * Per-product views vs. purchases over the last 30 days, keyed by the same
 * `item_id` (our product id) sent in every gaEvent call. Returns null when
 * GA4 credentials aren't configured, so callers can tell "not set up" apart
 * from "set up, nothing to report."
 */
export async function getViewsVsPurchases(): Promise<ProductViewsAndPurchases[] | null> {
  if (!propertyId || !clientEmail || !privateKey) return null;

  try {
    const client = new BetaAnalyticsDataClient({
      credentials: { client_email: clientEmail, private_key: privateKey },
    });

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "itemId" }, { name: "itemName" }],
      metrics: [{ name: "itemsViewed" }, { name: "itemPurchaseQuantity" }],
    });

    return (response.rows ?? []).map((row) => ({
      itemId: row.dimensionValues?.[0]?.value ?? "",
      itemName: row.dimensionValues?.[1]?.value ?? "",
      views: Number(row.metricValues?.[0]?.value ?? 0),
      purchases: Number(row.metricValues?.[1]?.value ?? 0),
    }));
  } catch (err) {
    console.error("GA4 Data API request failed:", err);
    return null;
  }
}
