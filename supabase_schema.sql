-- Supabase Database Schema for HOA Rent Services

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('tenant', 'landlord', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for users
alter table public.users enable row level security;

create policy "Allow public read access to users"
  on public.users for select
  using (true);

create policy "Allow admin write access to users"
  on public.users for all
  using (true); -- Custom rule check can go here


-- 2. PROPERTIES TABLE
create table if not exists public.properties (
  id text primary key,
  name text not null,
  street text not null,
  city text not null,
  state text not null,
  zip text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for properties
alter table public.properties enable row level security;

create policy "Allow public read access to properties"
  on public.properties for select
  using (true);

create policy "Allow admin write access to properties"
  on public.properties for all
  using (true);


-- 3. UNITS TABLE
create table if not exists public.units (
  id text primary key,
  property_id text references public.properties(id) on delete cascade not null,
  unit_number text not null,
  base_rent numeric not null,
  bedrooms integer not null,
  bathrooms integer not null,
  available boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for units
alter table public.units enable row level security;

create policy "Allow public read access to units"
  on public.units for select
  using (true);

create policy "Allow admin write access to units"
  on public.units for all
  using (true);


-- 4. PAYMENTS TABLE
create table if not exists public.payments (
  id text primary key,
  application_id text,
  amount numeric not null,
  classification text not null check (classification in ('application_fee', 'holding_fee', 'security_deposit', 'rent')),
  status text not null check (status in ('pending', 'completed', 'failed', 'held')),
  processor text not null,
  state text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  tenant_name text,
  unit_address text,
  proof_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for payments
alter table public.payments enable row level security;

create policy "Allow public insert to payments"
  on public.payments for insert
  with check (true);

create policy "Allow public read to payments"
  on public.payments for select
  using (true);

create policy "Allow admin to update payments"
  on public.payments for update
  using (true);


-- 5. PAGE SETTINGS TABLE (Single row config)
create table if not exists public.page_settings (
  id integer primary key default 1 check (id = 1),
  app_fee_amount numeric not null default 40,
  app_fee_disclosures text not null default 'Regional background check fees are capped by local state landlord-tenant regulations.',
  holding_fee_amount numeric not null default 250,
  holding_reservation_days integer not null default 30,
  holding_landlord_name text not null default 'Morgan Landlord',
  lease_landlord_name text not null default 'LEE SCOTT',
  lease_landlord_address text not null default '174 Schools Dr, Camden, TN',
  lease_landlord_email text not null default 'leescott11225@gmail.com',
  lease_furnished_status text not null default 'fully furnished',
  lease_pet_policy text not null default 'No pets allowed',
  security_bank_name text not null default 'HOA Rent Services Trust Bank',
  security_bank_address text not null default '120 Wall St, New York, NY',
  security_custom_apr numeric not null default 0.015,
  rent_grace_days integer not null default 5,
  rent_late_fee_percent numeric not null default 10,
  support_whatsapp text not null default '+1 (555) 0199',
  support_telegram text not null default '@hoarentservices_support',
  support_cell_phone text not null default '+1 (555) 0100',
  home_insurance_fee numeric not null default 499,
  home_insurance_note text not null default '',
  payment_note text not null default '',
  pay_venmo_handle text not null default '@hoarentservices',
  pay_venmo_qr text not null default '',
  pay_cash_app_handle text not null default '$hoarentservices',
  pay_cash_app_qr text not null default '',
  pay_chime_handle text not null default 'hoarentservices@chime.com',
  pay_chime_qr text not null default '',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed initial row
insert into public.page_settings (id)
values (1)
on conflict (id) do nothing;

-- Enable RLS for page_settings
alter table public.page_settings enable row level security;

create policy "Allow public read access to page_settings"
  on public.page_settings for select
  using (true);

create policy "Allow admin update access to page_settings"
  on public.page_settings for update
  using (true);


-- 6. STORAGE BUCKETS SETUP
-- Run this block inside Supabase console to initialize the bucket and enable access
-- Note: the 'storage' schema is managed by Supabase storage extension.

-- Insert bucket config
insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', true)
on conflict (id) do nothing;

-- Set up policies for the storage bucket
create policy "Allow public upload to payment-receipts"
  on storage.objects for insert
  with check (bucket_id = 'payment-receipts');

create policy "Allow public read from payment-receipts"
  on storage.objects for select
  using (bucket_id = 'payment-receipts');

create policy "Allow public delete from payment-receipts"
  on storage.objects for delete
  using (bucket_id = 'payment-receipts');
