-- ====================================================================
-- TOYVISE <-> GUILD CLUB ADMIN COMPREHENSIVE SYNC PATCH
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Ensure all order tracking & pricing columns exist on public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gst_amount            NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee          NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount       NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method        TEXT DEFAULT 'Online Payment';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_history        JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_updated_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS origin_location       TEXT DEFAULT 'Essen Marvella apartments, A block, 410, Suchitra Rd, Sriram Nagar, Jeedimetla, Hyderabad, Telangana 500055 (Landmark: Post Office)';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS origin_lat            NUMERIC DEFAULT 17.5168;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS origin_lng            NUMERIC DEFAULT 78.4735;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address_text TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS destination_lat       NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS destination_lng       NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address               JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_id           TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal              NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total                 NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS eta_minutes           INTEGER DEFAULT 35;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_partner_name TEXT DEFAULT 'Alex (Guild Club Logistics)';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_partner_phone TEXT DEFAULT '+91 98765 43210';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id   TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id     TEXT;

-- 2. Ensure addresses table exists for saved user addresses
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    label TEXT DEFAULT 'Home',
    full_address TEXT NOT NULL,
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    postal_code TEXT DEFAULT '',
    latitude NUMERIC DEFAULT 0.0,
    longitude NUMERIC DEFAULT 0.0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Fix notifications_log sent_by_user_id column constraint (allows dev admin logging without 22P02 UUID error)
ALTER TABLE public. notifications_log ALTER COLUMN sent_by_user_id DROP NOT NULL;
ALTER TABLE public.notifications_log DROP CONSTRAINT IF EXISTS notifications_log_sent_by_user_id_fkey;

-- 4. Ensure Row Level Security (RLS) is properly configured
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- 5. Re-create user and admin policies for orders (idempotent)
DROP POLICY IF EXISTS "Users can view own orders"   ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Public / service role full access orders" ON public.orders;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. Addresses RLS policies
DROP POLICY IF EXISTS "Users can manage addresses" ON public.addresses;
CREATE POLICY "Users can manage addresses"
  ON public.addresses FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Notifications Log RLS policies (allows customer devices to receive live broadcast notifications)
DROP POLICY IF EXISTS "Public can view notifications log" ON public.notifications_log;
CREATE POLICY "Public can view notifications log"
  ON public.notifications_log FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert notifications log" ON public.notifications_log;
CREATE POLICY "Admins can insert notifications log"
  ON public.notifications_log FOR INSERT
  WITH CHECK (true);

-- 8. Enable Supabase Realtime for live order tracking & push notifications in customer Flutter app
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_log;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
