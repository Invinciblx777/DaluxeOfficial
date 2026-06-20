-- ============================================================
-- DALUXE SKINCARE — COMPLETE SUPABASE SCHEMA (v3.1)
-- Handles multi-image support & admin role checks
-- ============================================================

-- ── TYPES ────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE user_role     AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE regimen_step  AS ENUM ('Cleanser','Toner','Serum','Moisturizer','Sunscreen','Treatment','Mask');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── PROFILES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  full_name  TEXT,
  phone      TEXT,
  role       user_role DEFAULT 'customer' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name  TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role       user_role DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- Address fields (added for profile persistence & checkout sync)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode    TEXT;
-- Admin features: ban system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned  BOOLEAN DEFAULT false;

-- ── PRODUCTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug           TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tagline        TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description    TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category       TEXT DEFAULT 'Face Serum';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price          NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount       NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_type  TEXT DEFAULT 'percent';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active      BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ingredients    JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS benefits       JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS skin_concern   TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS how_to_use     TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS suitable_for   TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS texture        TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fragrance      TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images         JSONB DEFAULT '[]'::jsonb; -- Array of {id, url, isMain}
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- ── ORDERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id                UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status                 TEXT DEFAULT 'pending' NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount           NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address       JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method         TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id             TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id         TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipment_id           TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS awb_code              TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_order_id   TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expected_delivery      DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url           TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email                TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_gateway       TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipment_status       TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code          TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount      NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_provider     TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON public.orders(status);

-- ── ORDER ITEMS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id   UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL, -- Sticking to TEXT/ID map for storefront compat
  name       TEXT, -- Product name stored at order time
  quantity   INTEGER NOT NULL DEFAULT 1,
  price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure name column exists if table was already created
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS name TEXT;

-- ── PENDING ORDERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pending_orders (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id   TEXT UNIQUE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_items       TEXT NOT NULL,
  shipping_address TEXT,
  amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
  email            TEXT,
  status           TEXT DEFAULT 'initiated' NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── FUNCTIONS ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'customer')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION decrement_stock(p_product_id TEXT, p_quantity INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id::text = p_product_id AND stock_quantity >= p_quantity;
END;
$$;

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop and recreate policies
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Products
CREATE POLICY "Products Select" ON public.products FOR SELECT USING (true);
CREATE POLICY "Products Admin"  ON public.products FOR ALL    USING (public.is_admin());

-- Orders
-- SECURITY: 'Orders Insert' and 'Order Items Insert' policies are intentionally OMITTED.
-- Customers cannot insert orders directly via the anon key (database forgery attack).
-- Only the Next.js API (using service_role key, which bypasses RLS) can create orders.
CREATE POLICY "Orders Select" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Orders Admin"  ON public.orders FOR ALL    USING (public.is_admin());

-- Order Items
-- SECURITY: No Insert policy for customers — only service_role (API) can insert.
CREATE POLICY "Order Items Select" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "Order Items Admin"  ON public.order_items FOR ALL USING (public.is_admin());

-- Profiles
CREATE POLICY "Profiles Select" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles Update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Pending Orders
CREATE POLICY "Pending Select" ON public.pending_orders FOR SELECT USING (user_id = auth.uid());

-- ── STORAGE BUCKETS ───────────────────────────────────────────
-- Manually create 'product-images' bucket in Supabase Dashboard
-- Enable RLS and add public select policy
