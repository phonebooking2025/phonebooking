-- Migration: Add new product fields for advanced features
-- Add columns for product video, qr code, buy-one-get-one offer, and EMI details

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_video text NULL;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS buy_one_get_one text NULL DEFAULT 'No';

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS offer_end_date_time timestamp with time zone NULL;

-- Create new table for EMI applications
CREATE TABLE IF NOT EXISTS public.emi_applications (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  user_id uuid not null,
  aadhar_number text null,
  bank_details text null,
  user_photo_url text null,
  emi_months integer null,
  monthly_emi numeric(10, 2) null,
  down_payment numeric(10, 2) null,
  application_status text not null default 'Pending',
  created_at timestamp with time zone null default now(),
  constraint emi_applications_pkey primary key (id),
  constraint emi_applications_order_id_fkey foreign key (order_id) references orders (id) on delete CASCADE,
  constraint emi_applications_user_id_fkey foreign key (user_id) references users (id) on delete CASCADE,
  constraint emi_applications_status_check check (
    application_status = any(array['Pending', 'Approved', 'Rejected', 'Active', 'Completed']::text[])
  )
) TABLESPACE pg_default;

-- Update orders table for EMI specific fields
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS emi_type text NULL DEFAULT 'NetPay';

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method text NULL DEFAULT 'QR';

-- Ensure backup for existing data (optional)
-- No data migration needed as these are additive columns
