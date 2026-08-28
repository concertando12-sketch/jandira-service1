-- =====================================================================
-- JENDIRA SERVICE — SCHEMA (FASE 1)
-- Marketplace regional de serviços — Jandira/SP
--
-- Como usar:
--   1. Abra o SQL Editor do seu projeto em https://app.supabase.com
--   2. Cole e rode este arquivo inteiro (uma vez só)
--   3. Depois rode supabase/seed.sql (dados de referência: cidade,
--      bairros, categorias, serviços)
--
-- Não depende de nenhuma API externa (sem Google Maps). A localização é
-- resolvida cruzando os bairros cadastrados (lat/lng fixos) com a
-- fórmula de distância Haversine calculada aqui no próprio Postgres.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('CLIENT', 'PROVIDER', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum ('PENDING', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- REGIÕES (cidades habilitadas + bairros com coordenadas fixas)
-- ---------------------------------------------------------------------
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  country text not null default 'BR',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (name, state, country)
);

create table if not exists public.neighborhoods (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (city_id, name)
);

-- ---------------------------------------------------------------------
-- USUÁRIOS (espelha auth.users; role controla o app inteiro)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  phone text,
  role user_role not null default 'CLIENT',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CATEGORIAS E SERVIÇOS (cadastráveis pelo admin, sem alterar código)
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PERFIL DO PRESTADOR
-- ---------------------------------------------------------------------
create table if not exists public.provider_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  professional_name text not null default '',
  description text,
  phone text,
  whatsapp text,
  profile_photo text,
  city_id uuid references public.cities(id),
  neighborhood_id uuid references public.neighborhoods(id),
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  service_radius_km numeric(5,2) not null default 5,
  price_from numeric(10,2),
  price_to numeric(10,2),
  availability text,
  is_verified boolean not null default false,
  is_active boolean not null default false,
  profile_completion int not null default 0,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_provider_profiles_active on public.provider_profiles(is_active);
create index if not exists idx_provider_profiles_neighborhood on public.provider_profiles(neighborhood_id);

create table if not exists public.provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (provider_id, service_id)
);

-- ---------------------------------------------------------------------
-- SOLICITAÇÕES DE SERVIÇO
-- ---------------------------------------------------------------------
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  service_id uuid not null references public.services(id),
  description text,
  address text,
  neighborhood_id uuid references public.neighborhoods(id),
  city text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  status request_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_requests_client on public.service_requests(client_id);
create index if not exists idx_service_requests_provider on public.service_requests(provider_id);

-- ---------------------------------------------------------------------
-- AVALIAÇÕES
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  service_request_id uuid not null unique references public.service_requests(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- FAVORITOS
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, provider_id)
);

-- =====================================================================
-- FUNÇÕES AUXILIARES
-- =====================================================================

-- Evita recursão de RLS ao checar se o usuário logado é admin.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- Distância em km entre duas coordenadas (fórmula Haversine).
create or replace function public.haversine_km(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
returns numeric
language sql
immutable
as $$
  select case
    when lat1 is null or lon1 is null or lat2 is null or lon2 is null then null
    else 6371 * acos(
      greatest(-1, least(1,
        cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1))
        + sin(radians(lat1)) * sin(radians(lat2))
      ))
    )
  end;
$$;

-- Cria a linha em public.users automaticamente quando alguém se cadastra
-- no Supabase Auth. O role vem do metadata do signUp, mas nunca aceita
-- 'ADMIN' vindo do cliente (só o admin cria outro admin via SQL/painel).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    case
      when new.raw_user_meta_data->>'role' = 'PROVIDER' then 'PROVIDER'::user_role
      else 'CLIENT'::user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impede que um usuário comum promova o próprio role para ADMIN/PROVIDER
-- via update direto na tabela (defesa em profundidade além do RLS).
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.users;
create trigger trg_prevent_role_escalation
  before update on public.users
  for each row execute function public.prevent_role_escalation();

-- Mantém rating_avg / rating_count sempre corretos no perfil do prestador.
create or replace function public.update_provider_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_provider uuid := coalesce(new.provider_id, old.provider_id);
begin
  update public.provider_profiles set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where provider_id = target_provider), 0),
    rating_count = (select count(*) from public.reviews where provider_id = target_provider)
  where id = target_provider;
  return null;
end;
$$;

drop trigger if exists trg_update_provider_rating on public.reviews;
create trigger trg_update_provider_rating
  after insert or update or delete on public.reviews
  for each row execute function public.update_provider_rating();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_provider_profiles on public.provider_profiles;
create trigger trg_touch_provider_profiles
  before update on public.provider_profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_service_requests on public.service_requests;
create trigger trg_touch_service_requests
  before update on public.service_requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- MOTOR DE BUSCA / MATCH (regras 5, 6, 16, 17, 32 da spec)
-- Nunca retorna prestador fora da cidade do bairro pesquisado nem fora
-- do raio de atendimento dele. Ordena: mesmo bairro > melhor avaliação
-- > menor distância.
-- ---------------------------------------------------------------------
create or replace function public.search_providers(p_service_slug text, p_neighborhood_id uuid)
returns table (
  provider_id uuid,
  professional_name text,
  profile_photo text,
  description text,
  price_from numeric,
  price_to numeric,
  rating_avg numeric,
  rating_count int,
  is_verified boolean,
  neighborhood_name text,
  service_radius_km numeric,
  distance_km numeric,
  same_neighborhood boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pp.id,
    pp.professional_name,
    pp.profile_photo,
    pp.description,
    pp.price_from,
    pp.price_to,
    pp.rating_avg,
    pp.rating_count,
    pp.is_verified,
    n.name,
    pp.service_radius_km,
    public.haversine_km(pp.latitude, pp.longitude, target.latitude, target.longitude) as distance_km,
    (pp.neighborhood_id = p_neighborhood_id) as same_neighborhood
  from public.provider_profiles pp
  join public.provider_services ps on ps.provider_id = pp.id
  join public.services s on s.id = ps.service_id and s.slug = p_service_slug and s.is_active
  join public.neighborhoods n on n.id = pp.neighborhood_id
  join public.neighborhoods target on target.id = p_neighborhood_id
  where pp.is_active = true
    and n.city_id = target.city_id
    and public.haversine_km(pp.latitude, pp.longitude, target.latitude, target.longitude) <= pp.service_radius_km
  order by same_neighborhood desc, pp.rating_avg desc nulls last, distance_km asc nulls last;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.cities enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.provider_services enable row level security;
alter table public.service_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;

-- cities / neighborhoods: leitura pública dos ativos, escrita só admin.
drop policy if exists "cities_select" on public.cities;
create policy "cities_select" on public.cities for select using (is_active or public.is_admin());
drop policy if exists "cities_admin_write" on public.cities;
create policy "cities_admin_write" on public.cities for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "neighborhoods_select" on public.neighborhoods;
create policy "neighborhoods_select" on public.neighborhoods for select using (is_active or public.is_admin());
drop policy if exists "neighborhoods_admin_write" on public.neighborhoods;
create policy "neighborhoods_admin_write" on public.neighborhoods for all using (public.is_admin()) with check (public.is_admin());

-- users: cada um vê/edita a si mesmo; admin vê/edita todos.
drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin" on public.users for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin" on public.users for update
  using (id = auth.uid() or public.is_admin());

-- categories / services: leitura pública dos ativos, escrita só admin.
drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories for select using (is_active or public.is_admin());
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "services_select" on public.services;
create policy "services_select" on public.services for select using (is_active or public.is_admin());
drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write" on public.services for all using (public.is_admin()) with check (public.is_admin());

-- provider_profiles: público vê os ativos; dono vê/edita o próprio; admin tudo.
drop policy if exists "provider_profiles_select" on public.provider_profiles;
create policy "provider_profiles_select" on public.provider_profiles for select
  using (is_active or user_id = auth.uid() or public.is_admin());
drop policy if exists "provider_profiles_insert_own" on public.provider_profiles;
create policy "provider_profiles_insert_own" on public.provider_profiles for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'PROVIDER')
  );
drop policy if exists "provider_profiles_update_own_or_admin" on public.provider_profiles;
create policy "provider_profiles_update_own_or_admin" on public.provider_profiles for update
  using (user_id = auth.uid() or public.is_admin());

-- provider_services: segue a visibilidade do provider_profiles dono.
drop policy if exists "provider_services_select" on public.provider_services;
create policy "provider_services_select" on public.provider_services for select
  using (
    exists (
      select 1 from public.provider_profiles pp
      where pp.id = provider_services.provider_id
        and (pp.is_active or pp.user_id = auth.uid() or public.is_admin())
    )
  );
drop policy if exists "provider_services_write_own_or_admin" on public.provider_services;
create policy "provider_services_write_own_or_admin" on public.provider_services for all
  using (
    exists (select 1 from public.provider_profiles pp where pp.id = provider_services.provider_id and pp.user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.provider_profiles pp where pp.id = provider_services.provider_id and pp.user_id = auth.uid())
    or public.is_admin()
  );

-- service_requests: só cliente dono, prestador dono e admin enxergam/mexem.
drop policy if exists "service_requests_select" on public.service_requests;
create policy "service_requests_select" on public.service_requests for select
  using (
    client_id = auth.uid()
    or exists (select 1 from public.provider_profiles pp where pp.id = service_requests.provider_id and pp.user_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "service_requests_insert_client" on public.service_requests;
create policy "service_requests_insert_client" on public.service_requests for insert
  with check (
    client_id = auth.uid()
    and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'CLIENT')
  );
drop policy if exists "service_requests_update" on public.service_requests;
create policy "service_requests_update" on public.service_requests for update
  using (
    client_id = auth.uid()
    or exists (select 1 from public.provider_profiles pp where pp.id = service_requests.provider_id and pp.user_id = auth.uid())
    or public.is_admin()
  );

-- reviews: leitura pública (fazem parte do perfil do prestador); só o
-- cliente dono do pedido concluído pode criar a avaliação daquele pedido.
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public" on public.reviews for select using (true);
drop policy if exists "reviews_insert_client" on public.reviews;
create policy "reviews_insert_client" on public.reviews for insert
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.service_requests sr
      where sr.id = reviews.service_request_id
        and sr.client_id = auth.uid()
        and sr.provider_id = reviews.provider_id
        and sr.status = 'COMPLETED'
    )
  );

-- favorites: só o próprio cliente.
drop policy if exists "favorites_all_own" on public.favorites;
create policy "favorites_all_own" on public.favorites for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());
