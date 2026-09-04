-- Stationery Webapp — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- ============== PRODUCTS ==============
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_paise bigint not null,          -- store money in paise (INR) to avoid float issues
  image_url text,
  stock_qty int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============== CUSTOMERS ==============
-- A lightweight "profile" — no auth account required, identified by mobile number.
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  mobile text not null unique,
  email text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  created_at timestamptz not null default now()
);

-- ============== ORDERS ==============
create type order_status as enum (
  'placed',
  'payment_pending_verification',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,           -- short human-friendly code e.g. ST-20260904-0001
  customer_id uuid not null references customers(id),
  status order_status not null default 'placed',

  subtotal_paise bigint not null,
  shipping_paise bigint not null default 0,
  total_paise bigint not null,

  -- static UPI flow
  upi_reference text,                            -- UTR / reference number customer enters as payment proof
  payment_confirmed_at timestamptz,
  payment_confirmed_by text,                     -- admin identifier

  -- delivery estimate shown at checkout
  estimated_delivery_days numeric,               -- e.g. 4.5
  estimated_delivery_date date,

  -- shiprocket integration (nullable until connected)
  shiprocket_order_id text,
  shiprocket_shipment_id text,
  shiprocket_awb text,
  courier_name text,
  tracking_url text,

  -- timestamps for each stage, used to train/refine the ETA estimator
  placed_at timestamptz not null default now(),
  confirmed_at timestamptz,
  packed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,      -- snapshot at time of order
  unit_price_paise bigint not null,
  quantity int not null,
  line_total_paise bigint not null
);

-- ============== DELIVERY STATS (per pincode) ==============
-- Rolling aggregates used to compute the "estimated time of delivery" shown
-- at checkout. Recomputed from delivered orders. This is the seed for the
-- learning ETA model — starts as a simple historical average, later swapped
-- for a proper model once enough rows exist.
create table if not exists delivery_stats_by_pincode (
  pincode text primary key,
  orders_delivered int not null default 0,
  avg_accept_hours numeric,     -- placed -> confirmed
  avg_pack_hours numeric,       -- confirmed -> packed
  avg_ship_hours numeric,       -- packed -> shipped
  avg_transit_hours numeric,    -- shipped -> delivered
  avg_total_hours numeric,      -- placed -> delivered
  updated_at timestamptz not null default now()
);

-- ============== INDEXES ==============
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);

-- ============== updated_at trigger ==============
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at before update on orders
for each row execute function set_updated_at();

-- ============== Row Level Security ==============
-- Public can read active products. Everything else goes through the
-- server (service role key), never the browser, so RLS stays locked down.
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table delivery_stats_by_pincode enable row level security;

create policy "Public can view active products" on products
  for select using (is_active = true);
