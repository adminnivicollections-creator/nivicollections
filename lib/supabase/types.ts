// Hand-written to match supabase/migrations/0001_init.sql.
// Regenerate from the live database once the Supabase CLI is linked:
//   supabase gen types typescript --linked > lib/supabase/types.ts

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type ShippingAddress = {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  position: number;
  image_path: string | null;
  active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string;
  price_paise: number;
  compare_at_paise: number | null;
  ready_to_ship: boolean;
  active: boolean;
  sku: string | null;
  barcode: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  storage_path: string;
  alt: string;
  position: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  size: string;
  stock: number;
  position: number;
};

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  role: "customer" | "admin";
  created_at: string;
};

export type Address = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  phone: string;
  shipping_address: ShippingAddress;
  subtotal_paise: number;
  shipping_paise: number;
  total_paise: number;
  status: OrderStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  coupon_code: string;
  discount_paise: number;
  tracking_number: string;
  carrier: string;
  admin_note: string;
  notes: string;
  gift_wrap: boolean;
  shipped_at: string | null;
  delivered_at: string | null;
  abandoned_email_1_sent_at: string | null;
  abandoned_email_2_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_slug: string;
  size: string;
  unit_price_paise: number;
  qty: number;
};

export type Subscriber = {
  id: string;
  email: string;
  source: string;
  created_at: string;
};

export type Wishlist = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

export type DiscountType = "percent" | "flat";

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  min_subtotal_paise: number;
  max_discount_paise: number | null;
  starts_at: string | null;
  expires_at: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  active: boolean;
  created_at: string;
};

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  product_id: string;
  order_item_id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  admin_reply: string | null;
  created_at: string;
};

export type ProductQuestion = {
  id: string;
  product_id: string;
  user_id: string;
  question: string;
  created_at: string;
};

export type ProductAnswer = {
  id: string;
  question_id: string;
  answer: string;
  created_at: string;
};

export type TryonUsage = {
  user_id: string;
  day: string;
  count: number;
};

export type HomepageSettings = {
  id: true;
  hero_image_path: string | null;
  updated_at: string;
};

export type StoreSettings = {
  id: true;
  legal_name: string;
  support_email: string;
  support_phone: string;
  address: string;
  gstin: string | null;
  return_window_days: number;
  free_shipping_above_paise: number;
  flat_shipping_paise: number;
  updated_at: string;
};

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  status: OrderStatus;
  created_at: string;
};

export type Refund = {
  id: string;
  order_id: string;
  razorpay_refund_id: string;
  amount_paise: number;
  reason: string;
  created_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      categories: Table<Category>;
      products: Table<Product>;
      product_images: Table<ProductImage>;
      product_variants: Table<ProductVariant>;
      profiles: Table<Profile>;
      addresses: Table<Address>;
      orders: Table<Order>;
      order_items: Table<OrderItem>;
      subscribers: Table<Subscriber>;
      wishlists: Table<Wishlist>;
      coupons: Table<Coupon>;
      reviews: Table<Review>;
      product_questions: Table<ProductQuestion>;
      product_answers: Table<ProductAnswer>;
      tryon_usage: Table<TryonUsage>;
      homepage_settings: Table<HomepageSettings>;
      store_settings: Table<StoreSettings>;
      order_status_history: Table<OrderStatusHistory>;
      refunds: Table<Refund>;
    };
    Views: Record<never, never>;
    Functions: {
      reserve_order_stock: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
      redeem_coupon: {
        Args: { p_code: string };
        Returns: undefined;
      };
      increment_tryon_usage: {
        Args: { p_user_id: string; p_max: number };
        Returns: number;
      };
      create_order: {
        Args: {
          p_user_id: string | null;
          p_email: string;
          p_phone: string;
          p_shipping_address: Record<string, unknown>;
          p_subtotal_paise: number;
          p_shipping_paise: number;
          p_coupon_code: string;
          p_discount_paise: number;
          p_total_paise: number;
          p_notes: string;
          p_gift_wrap: boolean;
          p_items: Record<string, unknown>[];
        };
        Returns: { id: string; order_number: string };
      };
    };
    Enums: { order_status: OrderStatus };
    CompositeTypes: Record<never, never>;
  };
};
