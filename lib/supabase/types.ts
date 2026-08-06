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
    };
    Views: Record<never, never>;
    Functions: {
      reserve_order_stock: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
    };
    Enums: { order_status: OrderStatus };
    CompositeTypes: Record<never, never>;
  };
};
