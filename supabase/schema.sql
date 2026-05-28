-- =============================================================
--  Conecta Pan - Schema do banco (Supabase / PostgreSQL)
--  Rode este arquivo no SQL Editor do seu projeto Supabase.
-- =============================================================

-- Extensao para gerar UUIDs
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
--  PROFILES  (identidade leve do usuario - sem senha, MVP)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  username     text unique not null,
  display_name text not null,
  avatar_color text not null default '#d9822b',
  status       text not null default 'Disponivel para um cafezinho',
  created_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
--  ROOMS  (global | group | dm)
-- -------------------------------------------------------------
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null default 'group' check (type in ('global','group','dm')),
  description text default '',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------------
--  ROOM_MEMBERS  (quem participa de cada sala)
-- -------------------------------------------------------------
create table if not exists public.room_members (
  room_id   uuid not null references public.rooms(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- -------------------------------------------------------------
--  MESSAGES
-- -------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  type       text not null default 'text' check (type in ('text','image')),
  created_at timestamptz not null default now()
);

-- se a tabela ja existia sem a coluna type, garante a migracao:
alter table public.messages
  add column if not exists type text not null default 'text';

create index if not exists idx_messages_room_created
  on public.messages (room_id, created_at);
create index if not exists idx_room_members_user
  on public.room_members (user_id);

-- -------------------------------------------------------------
--  ROOM_READS  (confirmacao de leitura: ate quando cada usuario leu)
-- -------------------------------------------------------------
create table if not exists public.room_reads (
  room_id      uuid not null references public.rooms(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- -------------------------------------------------------------
--  STORAGE  (bucket publico para imagens do chat)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

-- -------------------------------------------------------------
--  Sala global padrao  (todo mundo entra nela)
-- -------------------------------------------------------------
insert into public.rooms (id, name, type, description)
values (
  '00000000-0000-0000-0000-000000000001',
  'Conecta Pan - Geral',
  'global',
  'O balcao principal da padaria. Diga oi para todo mundo!'
)
on conflict (id) do nothing;

-- -------------------------------------------------------------
--  RLS: como o servidor usa a SERVICE ROLE KEY (bypassa RLS),
--  deixamos RLS ligado mas sem policies publicas. O acesso
--  acontece exclusivamente pelo backend (Socket.IO).
-- -------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;
alter table public.messages     enable row level security;
