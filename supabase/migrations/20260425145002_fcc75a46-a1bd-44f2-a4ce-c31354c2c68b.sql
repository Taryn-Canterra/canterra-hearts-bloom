create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  criteria jsonb not null default '{}'::jsonb,
  source text not null default 'cta_save_search',
  created_at timestamptz not null default now()
);

alter table public.saved_searches enable row level security;

create policy "Anyone can submit a saved search"
  on public.saved_searches
  for insert
  to anon, authenticated
  with check (true);

create table public.property_inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null,
  name text not null,
  email text not null,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.property_inquiries enable row level security;

create policy "Anyone can submit an inquiry"
  on public.property_inquiries
  for insert
  to anon, authenticated
  with check (true);
