-- Shadowfax / multi-courier support for the orders table.
-- Idempotent and additive — safe to run on the live DB and to re-run.
-- Run in the Supabase SQL editor.

-- Columns the fulfilment code writes to (no-ops if they already exist on prod).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_code         TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_id      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_status  TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id   TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_provider TEXT;  -- 'shadowfax' | 'shiprocket'

-- Enforce one confirmed order per PhonePe transaction. This is what makes
-- finalizePaidOrder() idempotent across the callback + verify-polling race:
-- the second writer's INSERT fails the unique constraint and we return the
-- order the first writer created instead of duplicating it / double-decrementing stock.
CREATE UNIQUE INDEX IF NOT EXISTS orders_transaction_id_key
  ON orders (transaction_id)
  WHERE transaction_id IS NOT NULL;

-- Helps the webhook + verify lookups.
CREATE INDEX IF NOT EXISTS orders_awb_code_idx ON orders (awb_code);
