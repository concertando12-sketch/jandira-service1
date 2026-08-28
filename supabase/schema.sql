-- =====================================================================
-- JANDIRA SERVICE — SCHEMA
-- Marketplace regional de serviços — Jandira/SP
--
-- Como usar:
--   1. Abra o SQL Editor do seu projeto em https://app.supabase.com
--   2. Cole e rode este arquivo inteiro (uma vez só)
--   3. Depois rode supabase/seed.sql (dados de referência: cidade,
--      bairros, categorias, serviços)
--
-- MODELO DE REGIÃO (Parte 2 da spec): bairros são DADOS, não código.
-- Um prestador "mora" em um bairro (region_id, opcional) mas "atende"
-- uma lista de bairros (tabela provider_regions, N:N) — são coisas
-- diferentes. O match cliente↔prestador é feito só cruzando
-- serviço + bairro atendido, sem depender de raio/lat-lng nem de
-- nenhuma API externa. Google Maps fica reservado para uma fase
-- futura (colunas latitude/longitude existem mas são opcionais).
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('CLIENT', 'PROVIDER', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum ('PENDING', 'ACCEPTED', 'DECLINED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type suggestion_status as enum ('PENDING', 'APPROVED', 'REJECTED');
exception when duplicate_object then null; end $$;

-- Homologação do prestador (Fase 6, item 10) — separado de
-- provider_profiles.is_active (que é o prestador publicando o
-- próprio perfil). Pra aparecer na busca precisa das duas coisas
-- (item 42): is_active = true E status = APPROVED.
do $$ begin
  create type provider_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INACTIVE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_type as enum ('IDENTITY', 'PROOF_OF_ADDRESS', 'PROFESSIONAL_DOCUMENT', 'OTHER');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- CIDADES E REGIÕES (bairros)
-- Estrutura cities → regions preparada para múltiplas cidades no
-- futuro (item 27), mas só Jandira-SP fica ativa no MVP.
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

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  slug text not null,
  -- Opcionais: só usados quando o Google Maps for integrado no futuro
  -- (cálculo de raio real). O MVP funciona 100% sem preenchê-los.
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, slug)
);

create index if not exists idx_regions_city on public.regions(city_id);

-- ---------------------------------------------------------------------
-- USUÁRIOS (espelha auth.users; role controla o app inteiro)
-- Precisa vir antes de region_suggestions/service_suggestions — as duas
-- referenciam public.users(id) em submitted_by.
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  phone text,
  role user_role not null default 'CLIENT',
  avatar_url text,
  -- Conta bloqueada pelo admin (Fase 6, item 8) — diferente do status
  -- de homologação do prestador, isso é "essa pessoa pode usar o
  -- app?" e vale pra CLIENT e PROVIDER igual.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bairros sugeridos por clientes/prestadores quando não encontram o
-- deles na lista (item 11/12). NUNCA viram bairro oficial sozinhos —
-- um admin precisa aprovar (aí sim uma linha em `regions` é criada).
create table if not exists public.region_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city_id uuid references public.cities(id),
  submitted_by uuid references public.users(id) on delete set null,
  status suggestion_status not null default 'PENDING',
  created_region_id uuid references public.regions(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ---------------------------------------------------------------------
-- ENDEREÇO (Fase 3.1) — cidade + bairro + rua/número/complemento.
-- Único para CLIENT e PROVIDER (mesma tabela pros dois papéis). No MVP
-- cada usuário tem só 1 endereço (unique em user_id); `is_primary`
-- já existe pra quando permitirmos múltiplos endereços no futuro
-- (item 21) sem precisar de outra migração.
-- ---------------------------------------------------------------------
create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  city_id uuid references public.cities(id),
  region_id uuid references public.regions(id),
  street text,
  number text,
  complement text,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_addresses_region on public.user_addresses(region_id);

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

-- Serviços/profissões sugeridos por prestadores quando não encontram o
-- deles na lista (espelha region_suggestions). NUNCA vira serviço
-- oficial sozinho — um admin precisa aprovar (aí sim uma linha em
-- `services` é criada).
create table if not exists public.service_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.categories(id),
  submitted_by uuid references public.users(id) on delete set null,
  status suggestion_status not null default 'PENDING',
  created_service_id uuid references public.services(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ---------------------------------------------------------------------
-- PERFIL DO PRESTADOR
-- Onde ele MORA fica em user_addresses (Fase 3.1, compartilhada com o
-- cliente). Onde ele ATENDE fica em provider_regions (N:N) — são
-- coisas diferentes (item 6/26 da spec).
-- ---------------------------------------------------------------------
create table if not exists public.provider_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  professional_name text not null default '',
  description text,
  phone text,
  whatsapp text,
  profile_photo text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  -- Reservado para quando o Google Maps entrar (raio real por
  -- lat/lng). Não usado no motor de busca do MVP — hoje quem define
  -- a cobertura é a lista de bairros em provider_regions.
  service_radius_km numeric(5,2),
  price_from numeric(10,2),
  price_to numeric(10,2),
  availability text,
  is_verified boolean not null default false,
  is_active boolean not null default false,
  -- Homologação (Fase 6, item 10/42): controlada só pelo admin (ver
  -- trigger prevent_provider_status_escalation, mais abaixo).
  status provider_status not null default 'PENDING',
  status_reason text,
  profile_completion int not null default 0,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_provider_profiles_active on public.provider_profiles(is_active);
create index if not exists idx_provider_profiles_status on public.provider_profiles(status);

create table if not exists public.provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (provider_id, service_id)
);

-- Bairros que o prestador ATENDE (N:N — item 6/7/22 da spec). Um
-- prestador pode atender vários bairros mesmo morando em só um.
create table if not exists public.provider_regions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  region_id uuid not null references public.regions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (provider_id, region_id)
);

create index if not exists idx_provider_regions_region on public.provider_regions(region_id);

-- ---------------------------------------------------------------------
-- SOLICITAÇÕES DE SERVIÇO
-- Guarda o endereço "congelado" no momento da solicitação (item 14/15
-- da Fase 3.1) — se o cliente mudar de endereço depois, o pedido
-- antigo continua com o endereço de quando foi feito.
--
-- Fluxo de status (Fase 5, item 2):
--   PENDING -> ACCEPTED -> SCHEDULED -> IN_PROGRESS -> COMPLETED
--   PENDING -> DECLINED
--   PENDING/ACCEPTED/SCHEDULED -> CANCELLED
-- Validado de verdade no trigger enforce_service_request_transition
-- (mais abaixo) — não dá pra pular etapa nem trocar de ator só
-- chamando a API do Supabase direto (item 38/39).
-- ---------------------------------------------------------------------
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  service_id uuid not null references public.services(id),
  description text,
  city_id uuid references public.cities(id),
  region_id uuid references public.regions(id),
  street text,
  number text,
  complement text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  requested_date date,
  requested_time time,
  status request_status not null default 'PENDING',
  -- Preenchidos pelo prestador ao aceitar/recusar (item 14/15).
  provider_price numeric(10,2),
  provider_response text,
  -- Preenchido por quem cancelar (cliente ou prestador — item 30/31).
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_requests_client on public.service_requests(client_id);
create index if not exists idx_service_requests_provider on public.service_requests(provider_id);

-- ---------------------------------------------------------------------
-- AVALIAÇÕES
-- Hoje só cliente avalia prestador. Item 29 da Fase 5 pede a
-- arquitetura pronta pra um dia o prestador também avaliar o cliente,
-- sem implementar ainda — quando chegar a hora, dá pra fazer com uma
-- tabela nova (ex: client_reviews) espelhando esta, sem mexer aqui.
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  service_request_id uuid not null unique references public.service_requests(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  -- Moderação (Fase 6, item 32) — nunca deleta, só esconde. A média
  -- do prestador (trigger update_provider_rating) só conta as
  -- visíveis.
  is_visible boolean not null default true,
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

-- ---------------------------------------------------------------------
-- DOCUMENTOS DO PRESTADOR (Fase 6, item 13)
-- Estrutura pronta pra quando homologação por documento entrar — o
-- MVP não exige nenhum documento nem tem upload ainda, só o schema.
-- ---------------------------------------------------------------------
create table if not exists public.provider_documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  document_type document_type not null,
  file_url text not null,
  status suggestion_status not null default 'PENDING',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- DENÚNCIAS (Fase 6, item 33/34/35)
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  service_request_id uuid references public.service_requests(id) on delete set null,
  reason text not null,
  description text,
  status report_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reports_reported_user on public.reports(reported_user_id);
create index if not exists idx_reports_status on public.reports(status);

-- ---------------------------------------------------------------------
-- LOG ADMINISTRATIVO (Fase 6, item 40) — quem fez o quê.
-- ---------------------------------------------------------------------
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_logs_created on public.admin_logs(created_at desc);

-- ---------------------------------------------------------------------
-- NOTIFICAÇÕES (item 34/35/36/37 da Fase 5)
-- Só é criada via função `notify()` (mais abaixo, security definer) —
-- não existe policy de insert direto, pra ninguém conseguir mandar
-- notificação forjada pra outro usuário.
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'INFO',
  service_request_id uuid references public.service_requests(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read);

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
-- Reservado para a fase futura com Google Maps (raio real) — o motor
-- de busca do MVP (search_providers) não usa isso hoje.
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
-- ou se desbloqueie sozinho (is_active) via update direto na tabela
-- (defesa em profundidade além do RLS — item 8 da Fase 6).
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role <> old.role then
      new.role := old.role;
    end if;
    if new.is_active <> old.is_active then
      new.is_active := old.is_active;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.users;
create trigger trg_prevent_role_escalation
  before update on public.users
  for each row execute function public.prevent_role_escalation();

-- Impede que o próprio prestador aprove/rejeite/verifique a si mesmo
-- (Fase 6, item 8/42) — só admin muda status/is_verified/status_reason.
create or replace function public.prevent_provider_status_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.status := old.status;
    new.is_verified := old.is_verified;
    new.status_reason := old.status_reason;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_provider_status_escalation on public.provider_profiles;
create trigger trg_prevent_provider_status_escalation
  before update on public.provider_profiles
  for each row execute function public.prevent_provider_status_escalation();

-- Mantém rating_avg / rating_count sempre corretos no perfil do
-- prestador — só considera avaliações visíveis (item 32 da Fase 6).
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
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where provider_id = target_provider and is_visible), 0),
    rating_count = (select count(*) from public.reviews where provider_id = target_provider and is_visible)
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

drop trigger if exists trg_touch_regions on public.regions;
create trigger trg_touch_regions
  before update on public.regions
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_user_addresses on public.user_addresses;
create trigger trg_touch_user_addresses
  before update on public.user_addresses
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_reports on public.reports;
create trigger trg_touch_reports
  before update on public.reports
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- MÁQUINA DE ESTADOS DA SOLICITAÇÃO (Fase 5, item 2/38/39/47)
-- Isso é o que garante de verdade que ninguém — nem chamando a API do
-- Supabase direto, pulando o app — consegue pular etapa, trocar
-- cliente/prestador/serviço de um pedido já criado, ou inventar um
-- provider_price/provider_response sem ser o prestador daquele pedido.
-- O server action (service-request-actions.ts) só existe pra dar
-- mensagem de erro amigável antes de chegar até aqui.
-- ---------------------------------------------------------------------
create or replace function public.enforce_service_request_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_client boolean;
  v_is_provider boolean;
begin
  if public.is_admin() then
    return new;
  end if;

  v_is_client := auth.uid() = old.client_id;
  v_is_provider := exists (
    select 1 from public.provider_profiles pp
    where pp.id = old.provider_id and pp.user_id = auth.uid()
  );

  if not v_is_client and not v_is_provider then
    raise exception 'Você não participa dessa solicitação.';
  end if;

  if new.client_id <> old.client_id or new.provider_id <> old.provider_id or new.service_id <> old.service_id then
    raise exception 'Não é permitido alterar cliente, prestador ou serviço de uma solicitação existente.';
  end if;

  if new.status <> old.status then
    if v_is_provider and old.status = 'PENDING' and new.status in ('ACCEPTED', 'DECLINED') then
      -- prestador aceita ou recusa
    elsif v_is_client and old.status = 'ACCEPTED' and new.status = 'SCHEDULED' then
      -- cliente confirma o valor/data combinados
    elsif v_is_provider and old.status = 'SCHEDULED' and new.status = 'IN_PROGRESS' then
      -- prestador inicia o serviço
    elsif v_is_provider and old.status = 'IN_PROGRESS' and new.status = 'COMPLETED' then
      -- prestador finaliza
    elsif v_is_client and old.status in ('PENDING', 'ACCEPTED', 'SCHEDULED') and new.status = 'CANCELLED' then
      -- cliente cancela antes do início
    elsif v_is_provider and old.status = 'SCHEDULED' and new.status = 'CANCELLED' then
      -- prestador cancela um serviço já agendado
    else
      raise exception 'Transição de status não permitida (% -> %).', old.status, new.status;
    end if;
  end if;

  if new.provider_price is distinct from old.provider_price and not v_is_provider then
    raise exception 'Só o prestador pode informar o valor do serviço.';
  end if;

  if new.provider_response is distinct from old.provider_response and not v_is_provider then
    raise exception 'Só o prestador pode registrar essa resposta.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_service_request_transition on public.service_requests;
create trigger trg_enforce_service_request_transition
  before update on public.service_requests
  for each row execute function public.enforce_service_request_transition();

-- Cria uma notificação (item 34/37) — só security definer pode
-- inserir na tabela notifications, e só a favor de alguém que
-- realmente participa da solicitação referenciada (evita spam
-- forjado pra outro usuário via chamada direta da API).
create or replace function public.notify(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text default 'INFO',
  p_service_request_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin pode notificar qualquer usuário por qualquer motivo (ex:
  -- homologação, sem solicitação nenhuma envolvida — Fase 6). Usuário
  -- comum só pode notificar alguém em nome de uma solicitação da qual
  -- ele mesmo participa — nunca manda notificação "solta".
  if not public.is_admin() then
    if p_service_request_id is null then
      raise exception 'Notificação sem solicitação associada só pode ser criada por um admin.';
    end if;
    if not exists (
      select 1 from public.service_requests sr
      left join public.provider_profiles pp on pp.id = sr.provider_id
      where sr.id = p_service_request_id
        and (sr.client_id = auth.uid() or pp.user_id = auth.uid())
    ) then
      raise exception 'Você não participa dessa solicitação.';
    end if;
  end if;

  insert into public.notifications (user_id, title, message, type, service_request_id)
  values (p_user_id, p_title, p_message, p_type, p_service_request_id);
end;
$$;

-- ---------------------------------------------------------------------
-- MOTOR DE BUSCA / MATCH (Fase 4, item 8/13/21/22 — sem raio, sem
-- Google Maps, sem texto: o cruzamento é 100% por service_id/region_id).
-- Encontra prestadores ativos que oferecem o serviço E que marcaram o
-- bairro pesquisado como atendido (provider_regions). Ordem (item 13):
-- verificado > avaliação > nº de avaliações > perfil completo.
-- Paginado (item 42/43) — não devolve tudo de uma vez.
-- ---------------------------------------------------------------------
create or replace function public.search_providers(
  p_service_slug text,
  p_region_id uuid,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  provider_id uuid,
  professional_name text,
  profile_photo text,
  description text,
  price_from numeric,
  price_to numeric,
  availability text,
  rating_avg numeric,
  rating_count int,
  is_verified boolean,
  profile_completion int,
  home_region_name text,
  other_regions text[]
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
    pp.availability,
    pp.rating_avg,
    pp.rating_count,
    pp.is_verified,
    pp.profile_completion,
    hr.name,
    coalesce(
      (
        select array_agg(r2.name order by r2.name)
        from public.provider_regions pr2
        join public.regions r2 on r2.id = pr2.region_id
        where pr2.provider_id = pp.id and pr2.region_id <> p_region_id
      ),
      '{}'
    )
  from public.provider_profiles pp
  join public.provider_services ps on ps.provider_id = pp.id
  join public.services s on s.id = ps.service_id and s.slug = p_service_slug and s.is_active
  join public.provider_regions pr on pr.provider_id = pp.id and pr.region_id = p_region_id
  left join public.user_addresses ua on ua.user_id = pp.user_id
  left join public.regions hr on hr.id = ua.region_id
  -- Regra mais importante do marketplace (Fase 6, item 42): só
  -- aparece publicado E homologado pelo admin.
  where pp.is_active = true and pp.status = 'APPROVED'
  order by pp.is_verified desc, pp.rating_avg desc nulls last, pp.rating_count desc, pp.profile_completion desc
  limit p_limit offset p_offset;
$$;

-- Aprova uma sugestão de bairro: cria a região oficial (evitando
-- duplicidade por slug) e marca a sugestão como aprovada, tudo numa
-- transação só. Só admin pode chamar (checado dentro da função).
create or replace function public.approve_region_suggestion(p_suggestion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_suggestion public.region_suggestions%rowtype;
  v_slug text;
  v_region_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem aprovar bairros.';
  end if;

  select * into v_suggestion from public.region_suggestions where id = p_suggestion_id;
  if v_suggestion is null then
    raise exception 'Sugestão não encontrada.';
  end if;
  if v_suggestion.status <> 'PENDING' then
    raise exception 'Essa sugestão já foi analisada.';
  end if;

  v_slug := regexp_replace(lower(unaccent(v_suggestion.name)), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  select id into v_region_id
  from public.regions
  where city_id = v_suggestion.city_id and slug = v_slug;

  if v_region_id is null then
    insert into public.regions (city_id, name, slug)
    values (v_suggestion.city_id, v_suggestion.name, v_slug)
    returning id into v_region_id;
  end if;

  update public.region_suggestions
    set status = 'APPROVED', created_region_id = v_region_id, reviewed_at = now()
    where id = p_suggestion_id;

  return v_region_id;
end;
$$;

create or replace function public.reject_region_suggestion(p_suggestion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem rejeitar bairros.';
  end if;

  update public.region_suggestions
    set status = 'REJECTED', reviewed_at = now()
    where id = p_suggestion_id and status = 'PENDING';
end;
$$;

-- Aprova uma sugestão de serviço/profissão: cria o serviço oficial
-- (evitando duplicidade por slug) e marca a sugestão como aprovada,
-- tudo numa transação só. Só admin pode chamar (checado dentro da
-- função). Espelha approve_region_suggestion.
create or replace function public.approve_service_suggestion(p_suggestion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_suggestion public.service_suggestions%rowtype;
  v_slug text;
  v_service_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem aprovar serviços.';
  end if;

  select * into v_suggestion from public.service_suggestions where id = p_suggestion_id;
  if v_suggestion is null then
    raise exception 'Sugestão não encontrada.';
  end if;
  if v_suggestion.status <> 'PENDING' then
    raise exception 'Essa sugestão já foi analisada.';
  end if;
  if v_suggestion.category_id is null then
    raise exception 'Sugestão sem categoria — não é possível aprovar.';
  end if;

  v_slug := regexp_replace(lower(unaccent(v_suggestion.name)), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  select id into v_service_id
  from public.services
  where slug = v_slug;

  if v_service_id is null then
    insert into public.services (category_id, name, slug)
    values (v_suggestion.category_id, v_suggestion.name, v_slug)
    returning id into v_service_id;
  end if;

  update public.service_suggestions
    set status = 'APPROVED', created_service_id = v_service_id, reviewed_at = now()
    where id = p_suggestion_id;

  return v_service_id;
end;
$$;

create or replace function public.reject_service_suggestion(p_suggestion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem rejeitar serviços.';
  end if;

  update public.service_suggestions
    set status = 'REJECTED', reviewed_at = now()
    where id = p_suggestion_id and status = 'PENDING';
end;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.cities enable row level security;
alter table public.regions enable row level security;
alter table public.region_suggestions enable row level security;
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.service_suggestions enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.provider_services enable row level security;
alter table public.provider_regions enable row level security;
alter table public.user_addresses enable row level security;
alter table public.service_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.provider_documents enable row level security;
alter table public.reports enable row level security;
alter table public.admin_logs enable row level security;

-- cities / regions: leitura pública dos ativos, escrita só admin.
drop policy if exists "cities_select" on public.cities;
create policy "cities_select" on public.cities for select using (is_active or public.is_admin());
drop policy if exists "cities_admin_write" on public.cities;
create policy "cities_admin_write" on public.cities for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "regions_select" on public.regions;
create policy "regions_select" on public.regions for select using (is_active or public.is_admin());
drop policy if exists "regions_admin_write" on public.regions;
create policy "regions_admin_write" on public.regions for all using (public.is_admin()) with check (public.is_admin());

-- region_suggestions: qualquer usuário logado pode sugerir e ver as
-- próprias sugestões; só admin vê/mexe em tudo.
drop policy if exists "region_suggestions_select" on public.region_suggestions;
create policy "region_suggestions_select" on public.region_suggestions for select
  using (submitted_by = auth.uid() or public.is_admin());
drop policy if exists "region_suggestions_insert" on public.region_suggestions;
create policy "region_suggestions_insert" on public.region_suggestions for insert
  with check (submitted_by = auth.uid());
drop policy if exists "region_suggestions_admin_update" on public.region_suggestions;
create policy "region_suggestions_admin_update" on public.region_suggestions for update
  using (public.is_admin());

-- users: cada um vê/edita a si mesmo; admin vê/edita todos.
drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin" on public.users for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin" on public.users for update
  using (id = auth.uid() or public.is_admin());

-- user_addresses: endereço é privado — só o dono e admin veem/mexem
-- (item 19: nunca fica público na tela do prestador).
drop policy if exists "user_addresses_all_own_or_admin" on public.user_addresses;
create policy "user_addresses_all_own_or_admin" on public.user_addresses for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- categories / services: leitura pública dos ativos, escrita só admin.
drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories for select using (is_active or public.is_admin());
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "services_select" on public.services;
create policy "services_select" on public.services for select using (is_active or public.is_admin());
drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write" on public.services for all using (public.is_admin()) with check (public.is_admin());

-- service_suggestions: qualquer usuário logado pode sugerir e ver as
-- próprias sugestões; só admin vê/mexe em tudo. Espelha region_suggestions.
drop policy if exists "service_suggestions_select" on public.service_suggestions;
create policy "service_suggestions_select" on public.service_suggestions for select
  using (submitted_by = auth.uid() or public.is_admin());
drop policy if exists "service_suggestions_insert" on public.service_suggestions;
create policy "service_suggestions_insert" on public.service_suggestions for insert
  with check (submitted_by = auth.uid());
drop policy if exists "service_suggestions_admin_update" on public.service_suggestions;
create policy "service_suggestions_admin_update" on public.service_suggestions for update
  using (public.is_admin());

-- provider_profiles: público só vê ativos E homologados (item 42);
-- dono sempre vê o próprio (mesmo pendente); admin vê tudo.
drop policy if exists "provider_profiles_select" on public.provider_profiles;
create policy "provider_profiles_select" on public.provider_profiles for select
  using ((is_active and status = 'APPROVED') or user_id = auth.uid() or public.is_admin());
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

-- provider_regions: mesmo padrão de provider_services.
drop policy if exists "provider_regions_select" on public.provider_regions;
create policy "provider_regions_select" on public.provider_regions for select
  using (
    exists (
      select 1 from public.provider_profiles pp
      where pp.id = provider_regions.provider_id
        and (pp.is_active or pp.user_id = auth.uid() or public.is_admin())
    )
  );
drop policy if exists "provider_regions_write_own_or_admin" on public.provider_regions;
create policy "provider_regions_write_own_or_admin" on public.provider_regions for all
  using (
    exists (select 1 from public.provider_profiles pp where pp.id = provider_regions.provider_id and pp.user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.provider_profiles pp where pp.id = provider_regions.provider_id and pp.user_id = auth.uid())
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
-- Cliente só cria pedido em nome dele mesmo, sempre PENDING e sem
-- inventar valor/resposta do prestador na hora de criar (item 38/39 —
-- isso complementa o trigger, que só age em UPDATE).
drop policy if exists "service_requests_insert_client" on public.service_requests;
create policy "service_requests_insert_client" on public.service_requests for insert
  with check (
    client_id = auth.uid()
    and status = 'PENDING'
    and provider_price is null
    and provider_response is null
    and cancel_reason is null
    and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'CLIENT')
  );
drop policy if exists "service_requests_update" on public.service_requests;
create policy "service_requests_update" on public.service_requests for update
  using (
    client_id = auth.uid()
    or exists (select 1 from public.provider_profiles pp where pp.id = service_requests.provider_id and pp.user_id = auth.uid())
    or public.is_admin()
  );

-- reviews: leitura pública das visíveis (fazem parte do perfil do
-- prestador) — item 32 da Fase 6: uma oculta pelo admin some da
-- vitrine, mas o próprio cliente que escreveu ainda enxerga a dele, e
-- admin enxerga tudo. Só o cliente dono do pedido concluído pode criar
-- a avaliação daquele pedido; só admin oculta/reexibe.
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public" on public.reviews for select
  using (is_visible or client_id = auth.uid() or public.is_admin());
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
drop policy if exists "reviews_admin_moderate" on public.reviews;
create policy "reviews_admin_moderate" on public.reviews for update
  using (public.is_admin())
  with check (public.is_admin());

-- favorites: só o próprio cliente.
drop policy if exists "favorites_all_own" on public.favorites;
create policy "favorites_all_own" on public.favorites for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- notifications: cada um só vê/marca como lida as próprias. Sem
-- policy de insert — só a função notify() (security definer) cria.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- provider_documents: dono e admin. Sem leitura pública (item 13 —
-- nem construído ainda, só o schema).
drop policy if exists "provider_documents_own_or_admin" on public.provider_documents;
create policy "provider_documents_own_or_admin" on public.provider_documents for all
  using (
    public.is_admin()
    or exists (select 1 from public.provider_profiles pp where pp.id = provider_documents.provider_id and pp.user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.provider_profiles pp where pp.id = provider_documents.provider_id and pp.user_id = auth.uid())
  );

-- reports (denúncias, item 33/34/35): quem denunciou vê a própria;
-- admin vê e resolve todas. Quem foi denunciado NUNCA vê (privacidade).
drop policy if exists "reports_select" on public.reports;
create policy "reports_select" on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports for insert
  with check (reporter_id = auth.uid());
drop policy if exists "reports_admin_update" on public.reports;
create policy "reports_admin_update" on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());

-- admin_logs (item 40): só admin lê; insert só o próprio admin
-- registrando a própria ação.
drop policy if exists "admin_logs_admin_select" on public.admin_logs;
create policy "admin_logs_admin_select" on public.admin_logs for select using (public.is_admin());
drop policy if exists "admin_logs_admin_insert" on public.admin_logs;
create policy "admin_logs_admin_insert" on public.admin_logs for insert
  with check (admin_id = auth.uid() and public.is_admin());

-- =====================================================================
-- PERMISSÕES DAS FUNÇÕES RPC
-- Garante explicitamente que a busca (pública) e as ações de aprovar/
-- rejeitar bairro (protegidas por is_admin() dentro da própria função)
-- são chamáveis via API — não depender do privilégio padrão do projeto.
-- =====================================================================
grant execute on function public.search_providers(text, uuid, int, int) to anon, authenticated;
grant execute on function public.notify(uuid, text, text, text, uuid) to authenticated;
grant execute on function public.approve_region_suggestion(uuid) to authenticated;
grant execute on function public.reject_region_suggestion(uuid) to authenticated;
grant execute on function public.approve_service_suggestion(uuid) to authenticated;
grant execute on function public.reject_service_suggestion(uuid) to authenticated;

-- =====================================================================
-- STORAGE — foto de perfil do prestador (Fase 7)
-- Bucket público (a foto aparece no perfil público do prestador —
-- item 9/17 da Fase 1). Cada prestador só escreve dentro da própria
-- pasta (prefixo = auth.uid()), igual ao padrão recomendado do
-- Supabase Storage.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('provider-photos', 'provider-photos', true)
on conflict (id) do nothing;

drop policy if exists "provider_photos_public_read" on storage.objects;
create policy "provider_photos_public_read" on storage.objects for select
  using (bucket_id = 'provider-photos');

drop policy if exists "provider_photos_own_write" on storage.objects;
create policy "provider_photos_own_write" on storage.objects for insert
  with check (bucket_id = 'provider-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "provider_photos_own_update" on storage.objects;
create policy "provider_photos_own_update" on storage.objects for update
  using (bucket_id = 'provider-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "provider_photos_own_delete" on storage.objects;
create policy "provider_photos_own_delete" on storage.objects for delete
  using (bucket_id = 'provider-photos' and (storage.foldername(name))[1] = auth.uid()::text);
