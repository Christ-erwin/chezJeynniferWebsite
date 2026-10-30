-- ============================================================================
-- Chez Jeynnifer — schéma de données multi-produits
-- ============================================================================
-- Postgres (Supabase / Neon). Un seul schéma sert les 3 produits (Loup-Garou,
-- Ciné Lune, Game Night) et tout produit futur : un produit n'est
-- qu'une ligne dans `products`, jamais une table à part. Toute la mécanique
-- de billetterie (instances d'événement, tarifs, commandes, paiement,
-- billets) est générique et partagée.
--
-- Hiérarchie :
--   product (le concept, ex. "Loup-Garou")
--     └─ event_instance (une occurrence datée, ex. "3ᵉ édition — 11/09/2026")
--          └─ ticket_tier (un tarif pour cette occurrence, ex. "Prévente")
--               └─ order_item (une ligne de commande)
--   order (une commande = 1 acheteur, N order_items, 1 event_instance)
--     └─ payment (1..N tentatives de paiement pour cette commande)
--   ticket (émis après paiement confirmé, 1 par place achetée)
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- products — un par concept d'événement (Loup-Garou, Ciné Lune, …)
-- ----------------------------------------------------------------------------
create table products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,               -- 'loup-garou', 'cinnefer', 'jeux-de-groupe'
  name          text not null,                       -- nom affiché
  tagline       text,                                -- accroche courte
  pitch         text,                                -- pitch long (page produit)
  status        text not null default 'draft'
                  check (status in ('draft', 'soon', 'live', 'archived')),
  accent_color  text,                                -- ex. '#e11d2e' — teinte d'identité du produit
  theme         jsonb not null default '{}'::jsonb,  -- réglages libres (polices, mots-clés, options d'affichage)
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- venues — lieux réutilisables entre événements/produits
-- ----------------------------------------------------------------------------
create table venues (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                       -- 'Lumina Suites — Rooftop'
  city          text not null,
  address       text,                                -- adresse précise (peut rester vide tant que non communiquée)
  reveal_after_booking boolean not null default false, -- adresse envoyée seulement après réservation confirmée
  lat           numeric(9,6),
  lng           numeric(9,6),
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- event_instances — une occurrence datée d'un produit
-- ----------------------------------------------------------------------------
create table event_instances (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  venue_id      uuid references venues(id) on delete set null,
  slug          text not null,                        -- unique par produit, ex. '3e-edition'
  title         text not null,                         -- '3ᵉ édition'
  subtitle      text,
  starts_at     timestamptz not null,
  doors_at      timestamptz,                            -- ouverture des portes si différente de starts_at
  ends_at       timestamptz,
  status        text not null default 'scheduled'
                  check (status in ('draft', 'scheduled', 'sold_out', 'cancelled', 'past')),
  capacity      int,                                    -- places totales, null = illimité/à définir
  details       jsonb not null default '{}'::jsonb,     -- champs libres propres au produit (dress code, programme…)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (product_id, slug)
);

create index event_instances_product_idx on event_instances (product_id, starts_at);
create index event_instances_starts_at_idx on event_instances (starts_at);

-- ----------------------------------------------------------------------------
-- ticket_tiers — un tarif possible pour une event_instance
-- ----------------------------------------------------------------------------
create table ticket_tiers (
  id              uuid primary key default gen_random_uuid(),
  event_instance_id uuid not null references event_instances(id) on delete cascade,
  label           text not null,                        -- 'Prévente', 'Jour J'
  price_amount    numeric(12,2) not null,
  currency        text not null default 'XOF',
  quota           int,                                  -- places allouées à ce tarif, null = pas de limite propre
  sold_count      int not null default 0,
  perks           text[] not null default '{}',          -- ['+ une bouteille d'alcool']
  sales_open_at   timestamptz,
  sales_close_at  timestamptz,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

create index ticket_tiers_event_idx on ticket_tiers (event_instance_id);

-- ----------------------------------------------------------------------------
-- orders — une commande (un panier validé par un acheteur)
-- ----------------------------------------------------------------------------
create table orders (
  id               uuid primary key default gen_random_uuid(),
  event_instance_id uuid not null references event_instances(id),
  buyer_name       text not null,
  buyer_phone      text not null,                        -- identifiant principal (Mobile Money)
  buyer_email      text,
  status           text not null default 'pending'
                     check (status in ('pending', 'paid', 'cancelled', 'refunded', 'expired')),
  total_amount     numeric(12,2) not null,
  currency         text not null default 'XOF',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index orders_event_idx on orders (event_instance_id, status);
create index orders_phone_idx on orders (buyer_phone);

-- ----------------------------------------------------------------------------
-- order_items — le détail d'une commande (N tarifs x quantité)
-- ----------------------------------------------------------------------------
create table order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  ticket_tier_id uuid not null references ticket_tiers(id),
  quantity       int not null check (quantity > 0),
  unit_price     numeric(12,2) not null
);

create index order_items_order_idx on order_items (order_id);

-- ----------------------------------------------------------------------------
-- payments — tentatives de paiement (agrégateur Mobile Money)
-- ----------------------------------------------------------------------------
create table payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  provider      text not null check (provider in ('cinetpay', 'paydunya')),
  provider_ref  text,                                    -- id transaction côté agrégateur
  status        text not null default 'initiated'
                  check (status in ('initiated', 'pending', 'success', 'failed', 'cancelled')),
  amount        numeric(12,2) not null,
  currency      text not null default 'XOF',
  raw_payload   jsonb,                                    -- webhook brut, pour audit/debug
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index payments_order_idx on payments (order_id);
create unique index payments_provider_ref_idx on payments (provider, provider_ref) where provider_ref is not null;

-- ----------------------------------------------------------------------------
-- tickets — un billet nominatif émis après paiement confirmé
-- ----------------------------------------------------------------------------
create table tickets (
  id             uuid primary key default gen_random_uuid(),
  order_item_id  uuid not null references order_items(id) on delete cascade,
  code           text not null unique,                    -- référence/QR scanné à l'entrée
  status         text not null default 'valid'
                   check (status in ('valid', 'used', 'void')),
  issued_at      timestamptz not null default now(),
  used_at        timestamptz
);

create index tickets_order_item_idx on tickets (order_item_id);

-- ----------------------------------------------------------------------------
-- Vue pratique : places restantes par tarif
-- ----------------------------------------------------------------------------
create view ticket_tier_availability as
select
  t.id as ticket_tier_id,
  t.event_instance_id,
  t.label,
  t.quota,
  t.sold_count,
  case when t.quota is null then null else greatest(t.quota - t.sold_count, 0) end as remaining
from ticket_tiers t;
