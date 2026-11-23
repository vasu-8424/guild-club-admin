-- ====================================================================
-- GUILD CLUB ADMIN PANEL SETUP & EXTENSIONS MIGRATION
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 0. CATEGORIES TABLE (Hierarchical with Parent-Child Structure)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon_key TEXT NOT NULL DEFAULT 'toys_rounded',
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    color_hex TEXT DEFAULT '#1E3A8A',
    banner_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- 1. ADMIN USERS TABLE (Role-based access control)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'owner')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for admin_users: only accessible by authenticated admins
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can view admin list" ON public.admin_users;
CREATE POLICY "Admin users can view admin list"
ON public.admin_users FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true));

-- 2. ENSURE BANNERS TABLE SUPPORTS HERO CAROUSEL EXTENDED FIELDS
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    badge TEXT DEFAULT 'FEATURED',
    image_url TEXT NOT NULL,
    video_url TEXT,
    cta_text TEXT DEFAULT 'Shop Now',
    target_category_slug TEXT,
    cta_link TEXT DEFAULT '/categories',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add any missing columns to existing banners table if it was created previously
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'FEATURED';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS cta_link TEXT DEFAULT '/categories';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Banners are viewable by everyone" ON public.banners;
CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT USING (true);

-- 3. FCM DEVICE TOKENS TABLE (For Push Notifications)
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token TEXT UNIQUE NOT NULL,
    platform TEXT DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
    device_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tokens" ON public.device_tokens;
CREATE POLICY "Users can manage own tokens"
ON public.device_tokens FOR ALL
USING (auth.uid() = user_id);

-- 4. NOTIFICATIONS AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    segment_type TEXT NOT NULL CHECK (segment_type IN ('all', 'cart_abandoned', 'city', 'single_user')),
    filter_criteria JSONB DEFAULT '{}'::jsonb,
    recipient_count INTEGER DEFAULT 0,
    sent_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sent_by_email TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('attempted', 'confirmed', 'sent', 'cancelled', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view notification logs" ON public.notifications_log;
CREATE POLICY "Admins can view notification logs"
ON public.notifications_log FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true));

-- 5. INVOICES TABLE (Metadata & Storage links for generated PDFs)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    subtotal NUMERIC NOT NULL,
    cgst NUMERIC DEFAULT 0,
    sgst NUMERIC DEFAULT 0,
    igst NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    pdf_url TEXT,
    sent_to_customer_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = customer_id);

-- 6. STORAGE BUCKETS INITIALIZATION
-- Ensures public buckets exist for assets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('categories', 'categories', true),
    ('products', 'products', true),
    ('banners', 'banners', true),
    ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;
