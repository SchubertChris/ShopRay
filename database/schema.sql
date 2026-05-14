-- ══════════════════════════════════════════════════════════════════════════════
-- ShopRay — Supabase Datenbankschema
-- ══════════════════════════════════════════════════════════════════════════════
-- Anleitung:
--   1. Gehe zu supabase.com → Dein Projekt → SQL Editor
--   2. Füge diesen gesamten Inhalt ein und klicke "Run"
--   3. Alle Tabellen und Sicherheitsregeln werden automatisch angelegt
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────────────────────
-- Erweiterung von auth.users — wird automatisch bei Registrierung angelegt
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT,
  phone            TEXT,
  address_street   TEXT,
  address_zip      TEXT,
  address_city     TEXT,
  address_country  TEXT        DEFAULT 'Deutschland',
  role             TEXT        NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatisch Profil anlegen wenn sich ein User registriert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── PRODUCTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  old_price   NUMERIC(10,2),
  discount    TEXT,
  badge       TEXT,
  category    TEXT        NOT NULL,
  rating      NUMERIC(3,1) DEFAULT 0,
  reviews     INTEGER      DEFAULT 0,
  stock       INTEGER      NOT NULL DEFAULT 0,
  image_url   TEXT,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug     ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_active   ON public.products (active);

-- ── ORDERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number       TEXT        NOT NULL UNIQUE,
  status             TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','paid','shipped','delivered','cancelled','payment_failed','refunded')),
  total              NUMERIC(10,2) NOT NULL,
  shipping_address   JSONB,
  stripe_session_id  TEXT,
  customer_note      TEXT,
  paid_at            TIMESTAMPTZ,
  shipped_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON public.orders (status);

-- ── ORDER ITEMS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID         NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   UUID         REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT         NOT NULL,
  quantity     INTEGER      NOT NULL CHECK (quantity > 0),
  price        NUMERIC(10,2) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- ── REVIEWS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       TEXT,
  body        TEXT,
  verified    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);

-- Produkt-Rating automatisch aktualisieren
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET
    rating  = (SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)),
    reviews = (SELECT COUNT(*)                        FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id))
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- ── TICKETS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject    TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  category   TEXT        NOT NULL DEFAULT 'other'
                         CHECK (category IN ('order','product','payment','other')),
  status     TEXT        NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open','in_progress','closed')),
  reply      TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status  ON public.tickets (status);

-- ── CONTACT INQUIRIES ────────────────────────────────────────────────────────
-- Externe Kontaktanfragen (ohne Login) — z. B. für Showcase-Seiten oder
-- Anfragen von Interessenten. Wird nicht mit auth.users verknüpft.
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT        NOT NULL DEFAULT 'Allgemeine Anfrage',
  message    TEXT        NOT NULL,
  consent    BOOLEAN     NOT NULL DEFAULT FALSE,
  status     TEXT        NOT NULL DEFAULT 'new'
                         CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created ON public.contact_inquiries (created_at DESC);

-- ── ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────────
-- Jeder Nutzer sieht und bearbeitet nur seine eigenen Daten.
-- Der Backend-Service-Key umgeht RLS (nur serverseitig verwenden!).

ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Eigenes Profil lesen"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Eigenes Profil updaten"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products (alle sehen, nur Admin schreibt — Admin nutzt Service Key)
CREATE POLICY "Produkte öffentlich lesen" ON public.products FOR SELECT USING (active = TRUE);

-- Orders
CREATE POLICY "Eigene Orders lesen"     ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Order erstellen"         ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items
CREATE POLICY "Eigene Items lesen" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

-- Reviews
CREATE POLICY "Reviews öffentlich lesen" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Review erstellen"         ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Eigene Review updaten"    ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Eigene Review löschen"    ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Tickets
CREATE POLICY "Eigene Tickets lesen"    ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Ticket erstellen"        ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contact Inquiries
-- Jeder darf einreichen (kein Login nötig) — nur wenn Consent gegeben
-- Lesen ist nur über den Service Key möglich (Backend + Admin)
CREATE POLICY "Kontaktanfrage einreichen" ON public.contact_inquiries
  FOR INSERT WITH CHECK (consent = TRUE);
-- Keine SELECT-Policy für angemeldete Nutzer → nur Service Key kann lesen

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_tickets
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
