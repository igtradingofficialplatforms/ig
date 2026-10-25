-- IGtrade Supabase foundation (account balances only; no real crypto custody)
-- Run in Supabase SQL Editor using a project you control. Review policies before public launch.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'member' check (role in ('member','admin')),
  virtual_balance numeric(18,2) not null default 10000 check (virtual_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.balance_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  admin_id uuid references public.profiles(id),
  amount numeric(18,2) not null,
  balance_after numeric(18,2) not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.deposit_addresses (
  id uuid primary key default gen_random_uuid(),
  network text not null unique check (network in ('TRC20','BTC','ETH')),
  address text not null default '',
  active boolean not null default false,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
insert into public.deposit_addresses(network,address,active) values ('TRC20','',false),('BTC','',false),('ETH','',false) on conflict (network) do nothing;

create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  network text not null check (network in ('TRC20','BTC','ETH')),
  amount numeric(18,2) not null check (amount >= 50),
  tx_hash text,
  screenshot_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.withdraw_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  network text not null check (network in ('TRC20','BTC','ETH')),
  address text not null,
  amount numeric(18,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market text not null,
  trade_type text not null check (trade_type in ('BUY','SELL')),
  amount numeric(18,2) not null check (amount > 0),
  duration_seconds integer not null check (duration_seconds in (30,60,120)),
  entry_price numeric(24,10) not null check (entry_price > 0),
  profit_percentage numeric(6,2) not null check (profit_percentage in (20,40,80)),
  result numeric(18,2),
  status text not null default 'open' check (status in ('open','won','lost','cancelled')),
  opened_at timestamptz not null default now(),
  closes_at timestamptz not null,
  closed_at timestamptz
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
insert into public.app_settings(key,value) values ('trading_enabled','true'::jsonb),('telegram_support_url','"https://t.me/"'::jsonb) on conflict (key) do nothing;

create or replace function public.is_igtrade_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.handle_new_igtrade_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles(id,email,display_name) values (new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','Member')) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_igtrade_user_created on auth.users;
create trigger on_igtrade_user_created after insert on auth.users for each row execute procedure public.handle_new_igtrade_user();

create or replace function public.admin_adjust_virtual_balance(p_user_id uuid, p_amount numeric, p_reason text)
returns public.profiles language plpgsql security definer set search_path = public
as $$
declare updated_profile public.profiles;
begin
  if not public.is_igtrade_admin() then raise exception 'Admin access required'; end if;
  if p_amount = 0 then raise exception 'Amount cannot be zero'; end if;
  update public.profiles set virtual_balance = virtual_balance + p_amount, updated_at = now()
    where id = p_user_id and virtual_balance + p_amount >= 0 returning * into updated_profile;
  if not found then raise exception 'Member not found or balance cannot become negative'; end if;
  insert into public.balance_ledger(user_id,admin_id,amount,balance_after,reason)
  values (p_user_id,auth.uid(),p_amount,updated_profile.virtual_balance,coalesce(nullif(trim(p_reason),''),'Admin adjustment'));
  return updated_profile;
end $$;

alter table public.profiles enable row level security;
alter table public.balance_ledger enable row level security;
alter table public.deposit_addresses enable row level security;
alter table public.deposit_requests enable row level security;
alter table public.withdraw_requests enable row level security;
alter table public.trades enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "profile read self or admin" on public.profiles;
create policy "profile read self or admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_igtrade_admin());
drop policy if exists "admin update profiles" on public.profiles;
create policy "admin update profiles" on public.profiles for update to authenticated using (public.is_igtrade_admin()) with check (public.is_igtrade_admin());
drop policy if exists "ledger read self or admin" on public.balance_ledger;
create policy "ledger read self or admin" on public.balance_ledger for select to authenticated using (user_id = auth.uid() or public.is_igtrade_admin());
drop policy if exists "active wallet addresses visible" on public.deposit_addresses;
create policy "active wallet addresses visible" on public.deposit_addresses for select to authenticated using (active or public.is_igtrade_admin());
drop policy if exists "admin manages wallet addresses" on public.deposit_addresses;
create policy "admin manages wallet addresses" on public.deposit_addresses for all to authenticated using (public.is_igtrade_admin()) with check (public.is_igtrade_admin());
drop policy if exists "deposit request read self or admin" on public.deposit_requests;
create policy "deposit request read self or admin" on public.deposit_requests for select to authenticated using (user_id = auth.uid() or public.is_igtrade_admin());
drop policy if exists "member creates deposit request" on public.deposit_requests;
create policy "member creates deposit request" on public.deposit_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "admin reviews deposit requests" on public.deposit_requests;
create policy "admin reviews deposit requests" on public.deposit_requests for update to authenticated using (public.is_igtrade_admin()) with check (public.is_igtrade_admin());
drop policy if exists "withdraw request read self or admin" on public.withdraw_requests;
create policy "withdraw request read self or admin" on public.withdraw_requests for select to authenticated using (user_id = auth.uid() or public.is_igtrade_admin());
drop policy if exists "member creates withdrawal request" on public.withdraw_requests;
create policy "member creates withdrawal request" on public.withdraw_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "admin reviews withdrawal requests" on public.withdraw_requests;
create policy "admin reviews withdrawal requests" on public.withdraw_requests for update to authenticated using (public.is_igtrade_admin()) with check (public.is_igtrade_admin());
drop policy if exists "trade read self or admin" on public.trades;
create policy "trade read self or admin" on public.trades for select to authenticated using (user_id = auth.uid() or public.is_igtrade_admin());
drop policy if exists "member starts trade" on public.trades;
create policy "member starts trade" on public.trades for insert to authenticated with check (user_id = auth.uid() and status = 'open');
drop policy if exists "admin manages settings" on public.app_settings;
create policy "admin manages settings" on public.app_settings for all to authenticated using (public.is_igtrade_admin()) with check (public.is_igtrade_admin());
drop policy if exists "authenticated reads settings" on public.app_settings;
create policy "authenticated reads settings" on public.app_settings for select to authenticated using (auth.uid() is not null);

-- IMPORTANT: Do not grant admin role through client-side forms. Promote the owner's profile manually in SQL:
-- update public.profiles set role = 'admin' where email = 'YOUR-OWNER-EMAIL';
-- Never put the Supabase service_role key in frontend code.
