-- Product scheduling: nullable publish_at so admins can queue a product
-- to go live at a future date/time.  NULL = immediately visible (if active).
alter table products add column publish_at timestamptz;
