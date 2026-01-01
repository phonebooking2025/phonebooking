create table public.emi_applications (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  user_id uuid not null,
  aadhar_number text null,
  bank_details text null,
  user_photo_url text null,
  emi_months integer null,
  monthly_emi numeric(10, 2) null,
  down_payment numeric(10, 2) null,
  application_status text not null default 'Pending'::text,
  created_at timestamp with time zone null default now(),
  constraint emi_applications_pkey primary key (id),
  constraint emi_applications_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint emi_applications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint emi_applications_status_check check (
    (
      application_status = any (
        array[
          'Pending'::text,
          'Approved'::text,
          'Rejected'::text,
          'Active'::text,
          'Completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.messages (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  content text not null,
  sender_type text not null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint messages_sender_type_check check (
    (
      sender_type = any (array['user'::text, 'admin'::text])
    )
  )
) TABLESPACE pg_default;


create table public.orders (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  product_id uuid not null,
  amount numeric(10, 2) not null,
  user_name text null,
  screenshot_url text not null,
  delivery_status text not null default 'Pending'::text,
  delivery_date date null,
  created_at timestamp with time zone null default now(),
  mobile text null,
  address text null,
  emi_type text null default 'NetPay'::text,
  payment_method text null default 'QR'::text,
  aadhar text null,
  bank_details text null,
  user_photo_url text null,
  emi_months integer null,
  down_payment numeric(10, 2) null,
  product_name text null,
  constraint orders_pkey primary key (id),
  constraint orders_product_id_fkey foreign KEY (product_id) references products (id) on delete RESTRICT,
  constraint orders_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint orders_delivery_status_check check (
    (
      delivery_status = any (
        array[
          'Pending'::text,
          'Confirmed'::text,
          'EMI Pending'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;


create table public.products (
  id uuid not null default gen_random_uuid (),
  category text not null,
  model text not null,
  price numeric(10, 2) null,
  booking_amount numeric(10, 2) null,
  netpay_price numeric(10, 2) null,
  offer integer null,
  full_specs text null,
  image_url text null,
  netpay_qr_url text null,
  created_at timestamp with time zone null default now(),
  emi_months text null,
  down_payment_amount numeric(10, 2) null default 0,
  offer_time timestamp with time zone null,
  product_video text null,
  buy_one_get_one text null default 'No'::text,
  offer_end_date_time timestamp with time zone null,
  constraint products_pkey primary key (id),
  constraint products_category_check check (
    (
      category = any (array['precious'::text, 'other'::text])
    )
  )
) TABLESPACE pg_default;

create table public.settings (
  id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  header_title text null,
  company_logo_url text null,
  delivery_image_url text null,
  banners jsonb null,
  updated_at timestamp with time zone null default now(),
  advertisement_video_url text null,
  whatsapp_number text null,
  header_bg_color character varying(7) null default '#1D4ED8'::character varying,
  constraint settings_pkey primary key (id)
) TABLESPACE pg_default;


create table public.users (
  id uuid not null default gen_random_uuid (),
  username text not null,
  phone text not null,
  password_hash text not null,
  is_admin boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_phone_key unique (phone)
) TABLESPACE pg_default;