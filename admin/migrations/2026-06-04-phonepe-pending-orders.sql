-- Create pending_orders table for PhonePe checkout flow
CREATE TABLE IF NOT EXISTS public.pending_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cart_items JSONB NOT NULL,
    shipping_address JSONB,
    amount NUMERIC(10, 2) NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'initiated',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on transaction_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_pending_orders_transaction_id ON public.pending_orders(transaction_id);

-- Add RLS policies (Optional, depending on your setup)
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can manage pending_orders" ON public.pending_orders
    USING (true) WITH CHECK (true);
    
-- Allow users to view their own pending orders (if needed)
CREATE POLICY "Users can view own pending_orders" ON public.pending_orders
    FOR SELECT USING (auth.uid() = user_id);
