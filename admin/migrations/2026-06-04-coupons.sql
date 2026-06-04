-- Add coupon tracking columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- Add coupon tracking columns to pending_orders table (for PhonePe flows)
ALTER TABLE public.pending_orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.pending_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
