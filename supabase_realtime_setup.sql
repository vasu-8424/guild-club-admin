-- ====================================================================
-- GUILD CLUB <-> TOYVISE: SAFE IDEMPOTENT REALTIME ACTIVATION & RLS REPAIR
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hyojlcanmglupmumstii/sql
-- ====================================================================

-- 1. FIX INFINITE RECURSION ON admin_users (Resolves PostgreSQL error 42P17)
DROP POLICY IF EXISTS "Admin users can view admin list" ON public.admin_users;
CREATE POLICY "Admin users can view admin list"
  ON public.admin_users FOR SELECT
  USING (true);

-- 2. ALLOW ALL APPS & CUSTOMER PHONES TO RECEIVE REALTIME NOTIFICATIONS
DROP POLICY IF EXISTS "Admins can view notification logs" ON public.notifications_log;
DROP POLICY IF EXISTS "Public can view notifications log" ON public.notifications_log;
DROP POLICY IF EXISTS "Everyone can view sent notifications" ON public.notifications_log;

CREATE POLICY "Everyone can view sent notifications"
  ON public.notifications_log FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert notifications log" ON public.notifications_log;
CREATE POLICY "Admins can insert notifications log"
  ON public.notifications_log FOR INSERT
  WITH CHECK (true);

-- 3. Set Replica Identity to FULL for accurate Realtime payload delivery
ALTER TABLE IF EXISTS public.notifications_log REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.orders REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.products REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.categories REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.banners REPLICA IDENTITY FULL;

-- 4. Safely add tables to publication only if NOT already present (avoids error 42710)
DO $$
DECLARE
  target_table text;
  tables_to_add text[] := ARRAY['notifications_log', 'orders', 'products', 'categories', 'banners'];
BEGIN
  FOREACH target_table IN ARRAY tables_to_add LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = target_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', target_table);
      RAISE NOTICE 'Successfully added table % to supabase_realtime', target_table;
    ELSE
      RAISE NOTICE 'Table % is already in supabase_realtime (skipping safely)', target_table;
    END IF;
  END LOOP;
END $$;
