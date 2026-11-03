create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null check (char_length(btrim(description)) between 1 and 160),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null check (char_length(btrim(category)) between 1 and 40),
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index expenses_user_date_idx
  on public.expenses (user_id, expense_date desc);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  amount numeric(12, 2) check (amount is null or amount > 0),
  due_date date,
  status text not null default 'pending'
    check (status in ('pending', 'to_buy', 'to_pay', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wishlist_user_created_idx
  on public.wishlist (user_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger wishlist_set_updated_at
before update on public.wishlist
for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;
alter table public.categories enable row level security;
alter table public.wishlist enable row level security;

create policy "Users manage their own expenses"
  on public.expenses for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own categories"
  on public.categories for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own wishlist"
  on public.wishlist for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.wishlist to authenticated;
