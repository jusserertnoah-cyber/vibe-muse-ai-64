-- Table pour tracker les achats de crédits
create table public.credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_session_id text not null unique,
  price_id text not null,
  amount_cents integer not null,
  currency text not null default 'eur',
  scans_granted integer not null,
  status text not null default 'pending',
  environment text not null default 'sandbox',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_credit_purchases_user on public.credit_purchases(user_id);
create index idx_credit_purchases_session on public.credit_purchases(stripe_session_id);

alter table public.credit_purchases enable row level security;

create policy "Users can view own purchases"
  on public.credit_purchases for select
  using (auth.uid() = user_id);

create policy "Service role manages purchases"
  on public.credit_purchases for all
  using (auth.role() = 'service_role');

-- Trigger updated_at
create trigger trg_credit_purchases_updated
before update on public.credit_purchases
for each row execute function public.set_updated_at();

-- Fonction pour créditer atomiquement un user (vibers = crédits)
create or replace function public.add_credits(target_user uuid, scans integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set vibers = coalesce(vibers, 0) + scans,
      updated_at = now()
  where id = target_user;
end;
$$;