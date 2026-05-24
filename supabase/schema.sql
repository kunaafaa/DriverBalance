-- DriverMade CRM Database Schema
-- Location: Abu Dhabi, UAE
-- Currency: AED
-- VAT: 5%

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Customers Table
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text unique not null,
  address text,
  city text default 'Abu Dhabi',
  postal_code text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Vehicles Table
create table if not exists vehicles (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  make text not null,
  model text not null,
  year integer not null,
  vin text unique not null,
  license_plate text unique not null,
  color text,
  engine_type text default 'Petrol',
  mileage_at_registration integer default 0,
  current_mileage integer default 0,
  last_service_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Service Types Table
create table if not exists service_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  description text,
  base_price decimal(10, 2) not null,
  estimated_duration_minutes integer default 60,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 4. Appointments Table
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  scheduled_date timestamp with time zone not null,
  estimated_duration_minutes integer default 60,
  status text check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) default 'pending',
  technician_assigned text,
  completion_time timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. Parts Inventory Table
create table if not exists parts_inventory (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sku text unique not null,
  category text,
  quantity_in_stock integer default 0,
  reorder_level integer default 5,
  unit_price decimal(10, 2) not null,
  supplier text,
  supplier_contact text,
  last_restocked timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 6. Invoices Table
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid references appointments(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  invoice_number text unique not null,
  issue_date timestamp with time zone default now(),
  due_date timestamp with time zone,
  subtotal decimal(10, 2) not null default 0,
  tax_rate decimal(5, 2) default 5.00, -- UAE VAT
  tax_amount decimal(10, 2) not null default 0,
  discount decimal(10, 2) default 0,
  total decimal(10, 2) not null default 0,
  status text check (status in ('draft', 'issued', 'paid', 'overdue', 'cancelled')) default 'draft',
  payment_method text check (payment_method in ('cash', 'card', 'bank_transfer', 'pending')) default 'pending',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 7. Invoice Items Table
create table if not exists invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade,
  description text not null,
  quantity integer not null default 1,
  unit_price decimal(10, 2) not null,
  total decimal(10, 2) not null,
  item_type text check (item_type in ('service', 'part', 'labor')) not null,
  created_at timestamp with time zone default now()
);

-- 8. Service History Table
create table if not exists service_history (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  service_description text not null,
  parts_used text,
  mileage_at_service integer,
  date_completed timestamp with time zone default now(),
  total_cost decimal(10, 2),
  technician text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 9. Quotations Table
create table if not exists quotations (
  id uuid primary key default uuid_generate_v4(),
  quotation_number text unique not null,
  issue_date timestamp with time zone default now(),
  valid_until timestamp with time zone,
  car_make text not null,
  car_model text not null,
  car_year integer not null,
  license_plate text not null,
  customer_name text,
  customer_phone text,
  subtotal decimal(10, 2) not null default 0,
  tax_rate decimal(5, 2) default 5.00,
  tax_amount decimal(10, 2) not null default 0,
  discount decimal(10, 2) default 0,
  total decimal(10, 2) not null default 0,
  status text check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')) default 'draft',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 10. Quotation Items Table
create table if not exists quotation_items (
  id uuid primary key default uuid_generate_v4(),
  quotation_id uuid references quotations(id) on delete cascade,
  description text not null,
  quantity integer not null default 1,
  unit_price decimal(10, 2) not null,
  total decimal(10, 2) not null,
  item_type text check (item_type in ('service', 'part', 'labor')) not null,
  created_at timestamp with time zone default now()
);

-- RLS (Row Level Security) - Simplified for now
-- In a real app, you would add policies for 'authenticated' users

alter table customers enable row level security;
alter table vehicles enable row level security;
alter table service_types enable row level security;
alter table appointments enable row level security;
alter table parts_inventory enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table service_history enable row level security;
alter table quotations enable row level security;
alter table quotation_items enable row level security;

-- Policies (Allow all for research purposes, should be restricted in prod)
create policy "Enable all for authenticated users" on customers for all to authenticated using (true);
create policy "Enable all for authenticated users" on vehicles for all to authenticated using (true);
create policy "Enable all for authenticated users" on service_types for all to authenticated using (true);
create policy "Enable all for authenticated users" on appointments for all to authenticated using (true);
create policy "Enable all for authenticated users" on parts_inventory for all to authenticated using (true);
create policy "Enable all for authenticated users" on invoices for all to authenticated using (true);
create policy "Enable all for authenticated users" on invoice_items for all to authenticated using (true);
create policy "Enable all for authenticated users" on service_history for all to authenticated using (true);
create policy "Enable all for authenticated users" on quotations for all to authenticated using (true);
create policy "Enable all for authenticated users" on quotation_items for all to authenticated using (true);
