export type AdminRole = 'staff' | 'manager' | 'owner';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_key: string;
  parent_id: string | null;
  sort_order: number;
  color_hex: string;
  banner_url?: string | null;
  is_active: boolean;
  created_at?: string;
  subcategories?: Category[];
}

export interface Product {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string;
  price: number;
  original_price?: number | null;
  discount_percentage?: number;
  rating?: number;
  review_count?: number;
  stock_quantity: number;
  category_id?: string | null;
  brand_id?: string | null;
  min_age?: number;
  max_age?: number;
  material?: string;
  educational_type?: string;
  is_trending?: boolean;
  is_best_seller?: boolean;
  is_featured?: boolean;
  is_limited_edition?: boolean;
  image_urls?: string[];
  available_colors?: string[];
  safety_certification?: string;
  specifications?: Record<string, string>;
  created_at?: string;
  category?: Category;
}

export type OrderStatus = 'placed' | 'preparing' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  product_id: string;
  title: string;
  qty: number;
  price: number;
  image_url?: string;
  color?: string;
}

export interface Order {
  id: string;
  user_id: string;
  address_id?: string | null;
  items: OrderItem[];
  subtotal: number;
  total: number;
  gst_amount?: number;
  delivery_fee?: number;
  discount_amount?: number;
  payment_method?: string;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  status: OrderStatus;
  status_updated_at: string;
  status_history: Record<string, string>;
  origin_location?: string;
  origin_lat?: number;
  origin_lng?: number;
  delivery_address_text?: string;
  destination_lat?: number;
  destination_lng?: number;
  eta_minutes?: number;
  delivery_partner_name?: string;
  delivery_partner_phone?: string;
  created_at: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
  };
  address?: {
    id?: string;
    label?: string;
    full_address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
  } | Record<string, any> | string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string;
  image_url: string;
  video_url?: string | null;
  cta_text: string;
  target_category_slug?: string | null;
  cta_link: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_address?: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  pdf_url?: string;
  sent_to_customer_at?: string | null;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  title: string;
  body: string;
  segment_type: 'all' | 'cart_abandoned' | 'city' | 'single_user';
  filter_criteria?: Record<string, any>;
  recipient_count: number;
  sent_by_user_id?: string;
  sent_by_email?: string;
  status: 'attempted' | 'confirmed' | 'sent' | 'cancelled' | 'failed';
  error_message?: string | null;
  created_at: string;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  fcm_token: string;
  platform: 'android' | 'ios' | 'web';
  device_info?: Record<string, any>;
  is_active: boolean;
  created_at: string;
}
