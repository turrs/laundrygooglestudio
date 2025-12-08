
import React from 'react';

export const SQL_SCHEMA = `
-- DANGER: DROP EXISTING TABLES TO RESET SCHEMA
-- This ensures a clean slate for the application logic.
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Tables

-- Locations
create table public.locations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Services
create table public.services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric not null,
  unit text not null,
  description text,
  duration_hours numeric default 48, -- New field: Default 48 hours (2 days)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customers
create table public.customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  email text,
  address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key, -- Linked directly to Auth ID
  auth_id uuid references auth.users(id) on delete cascade, -- Redundant but kept for query compatibility
  name text not null,
  email text not null,
  role text not null check (role in ('OWNER', 'STAFF')),
  location_id uuid references public.locations(id),
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.customers(id),
  customer_name text not null,
  location_id uuid references public.locations(id),
  total_amount numeric not null,
  status text not null,
  perfume text,
  received_by text,
  completed_by text,
  rating integer,
  review text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order Items
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  service_id uuid references public.services(id),
  service_name text not null,
  price numeric not null,
  quantity numeric not null
);

-- Expenses
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  description text not null,
  amount numeric not null,
  category text not null,
  recorded_by text,
  location_id uuid references public.locations(id),
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.locations enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.expenses enable row level security;

-- 4. Create Policies

-- Locations
create policy "Enable all for authenticated" on public.locations for all to authenticated using (true) with check (true);

-- Services
create policy "Enable all for authenticated" on public.services for all to authenticated using (true) with check (true);

-- Customers
create policy "Enable all for authenticated" on public.customers for all to authenticated using (true) with check (true);

-- Profiles
create policy "Public read profiles" on public.profiles for select to authenticated using (true);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

-- Orders
create policy "Enable all for authenticated" on public.orders for all to authenticated using (true) with check (true);
create policy "Enable read for tracking" on public.orders for select to anon using (true);
create policy "Enable update for tracking" on public.orders for update to anon using (true);

-- Order Items
create policy "Enable all for authenticated" on public.order_items for all to authenticated using (true) with check (true);
create policy "Enable read for tracking" on public.order_items for select to anon using (true);

-- Expenses
create policy "Enable all for authenticated" on public.expenses for all to authenticated using (true) with check (true);

-- 5. PERFORMANCE INDEXES
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_location_id ON public.orders(location_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX idx_expenses_location_id ON public.expenses(location_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_name ON public.customers(name);

-- 6. TRIGGER FOR NEW USER CREATION (FIX FOR MISSING PROFILES)
-- This function runs automatically whenever a new user signs up via Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, auth_id, name, email, role, is_approved)
  values (
    new.id,
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'role',
    (new.raw_user_meta_data->>'role')::text = 'OWNER' -- Auto approve if OWNER, set false if STAFF
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`;

export const SupabaseSchema = () => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-slate-50 p-6 rounded-xl overflow-hidden shadow-2xl max-w-4xl mx-auto my-8 border border-slate-700">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
        <div>
            <h3 className="text-xl font-bold text-red-400">PENTING: Reset Database Schema</h3>
            <p className="text-slate-400 text-sm">Update Skema Database diperlukan (Auto-Profile Trigger). <br/>Copy kode di bawah, lalu paste & jalankan di <strong>Supabase SQL Editor</strong>.</p>
        </div>
        <button 
          onClick={handleCopy}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
        >
          {copied ? 'Copied!' : 'Copy SQL'}
        </button>
      </div>
      <pre className="font-mono text-xs overflow-auto max-h-[400px] p-4 bg-slate-950 rounded-lg text-green-400 custom-scrollbar">
        {SQL_SCHEMA}
      </pre>
    </div>
  );
};
