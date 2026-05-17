-- ══════════════════════════════════════════════════════════════════════════════
-- ShopRay — Vollständiges Datenbankschema (konsolidiert)
-- Stand: 2026-05-17 — enthält alle Änderungen aus Migrations 001–013
-- ══════════════════════════════════════════════════════════════════════════════
--
-- FRISCHE INSTALLATION (Neukunde):
--   1. Dieses Script (schema.sql) ausführen → alle Tabellen, Trigger, Grants
--   2. Optional: seed.sql ausführen → Beispieldaten zum Testen
--
-- BESTEHENDE DATENBANK AKTUALISIEREN:
--   Nur die jeweils neue Migration ausführen (migration_XXX.sql)
--
-- Ausführen: Supabase → SQL Editor → Inhalt einfügen → Run
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────────────────────
-- Erweiterung von auth.users — wird automatisch bei Registrierung angelegt
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT,
  email            TEXT,
  phone            TEXT,
  address_street   TEXT,
  address_zip      TEXT,
  address_city     TEXT,
  address_country  TEXT        DEFAULT 'Deutschland',
  role             TEXT        NOT NULL DEFAULT 'customer'
                               CHECK (role IN ('owner', 'admin', 'mod', 'customer')),
  banned_at        TIMESTAMPTZ,
  banned_until     TIMESTAMPTZ,                         -- NULL = dauerhaft gesperrt
  ban_reason       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatisch Profil anlegen wenn sich ein User registriert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── PRODUCTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT          NOT NULL,
  slug             TEXT          NOT NULL UNIQUE,
  description      TEXT,
  price            NUMERIC(10,2) NOT NULL,
  old_price        NUMERIC(10,2),
  discount         TEXT,
  badge            TEXT,
  category         TEXT          NOT NULL,
  rating           NUMERIC(3,1)  DEFAULT 0,
  reviews          INTEGER       DEFAULT 0,
  stock            INTEGER       NOT NULL DEFAULT 0,
  image_url        TEXT,
  images           JSONB         NOT NULL DEFAULT '[]'::jsonb,
  active           BOOLEAN       NOT NULL DEFAULT TRUE,
  tax_rate         NUMERIC(5,2)  NOT NULL DEFAULT 19,
  rich_description TEXT,
  highlights       JSONB         NOT NULL DEFAULT '[]'::jsonb,
  certifications   JSONB         NOT NULL DEFAULT '[]'::jsonb,
  lmiv             JSONB,
  dealer_links     JSONB         NOT NULL DEFAULT '[]'::jsonb,
  documents        JSONB         NOT NULL DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug     ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_active   ON public.products (active);

-- ── CATEGORIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  "order"    INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories ("order", name);

-- Standard-Kategorien (können im Admin-Panel erweitert werden)
INSERT INTO public.categories (name, "order") VALUES
  ('Wohnen',    0),
  ('Deko',      1),
  ('Küche',     2),
  ('Textilien', 3),
  ('Kunst',     4)
ON CONFLICT (name) DO NOTHING;

-- ── ORDERS ───────────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1;

CREATE TABLE IF NOT EXISTS public.orders (
  id                 UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number       TEXT          NOT NULL UNIQUE,
  status             TEXT          NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending','paid','shipped','delivered','cancelled','payment_failed','refunded')),
  total              NUMERIC(10,2) NOT NULL,
  shipping_address   JSONB,
  stripe_session_id  TEXT,
  payment_method     TEXT,
  customer_note      TEXT,
  paid_at            TIMESTAMPTZ,
  shipped_at         TIMESTAMPTZ,
  invoice_number     TEXT          UNIQUE,
  tracking_number    TEXT,
  label_b64          TEXT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON public.orders (status);

-- ── ORDER ITEMS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   UUID          REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT          NOT NULL,
  quantity     INTEGER       NOT NULL CHECK (quantity > 0),
  price        NUMERIC(10,2) NOT NULL,
  image_url    TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
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

-- ── ticket_messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender     TEXT NOT NULL CHECK (sender IN ('customer', 'admin')),
  text       TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_created_at_idx
  ON public.ticket_messages (ticket_id, created_at);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_read_own_messages" ON public.ticket_messages
  FOR SELECT USING (ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid()));
CREATE POLICY "customer_insert_own_messages" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    sender = 'customer' AND
    ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid())
  );
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;

-- ── CONTACT INQUIRIES ────────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status  ON public.contact_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created ON public.contact_inquiries (created_at DESC);

-- ── ADMIN LOGIN LOG ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_login_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT        NOT NULL,
  user_agent TEXT,
  success    BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_admin_login_log_created_at
  ON public.admin_login_log (created_at DESC);

-- ── SHIPPING SETTINGS (Singleton-Tabelle) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipping_settings (
  id         INTEGER      PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  standard   NUMERIC(6,2) NOT NULL DEFAULT 4.90,
  express    NUMERIC(6,2) NOT NULL DEFAULT 9.90,
  free_above NUMERIC(8,2) NOT NULL DEFAULT 50.00,
  delivery   TEXT         NOT NULL DEFAULT '2–4 Werktage',
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO public.shipping_settings (id, standard, express, free_above, delivery)
VALUES (1, 4.90, 9.90, 50.00, '2–4 Werktage')
ON CONFLICT (id) DO NOTHING;

-- ── ADMIN TOTP (2FA) ─────────────────────────────────────────────────────────
-- Eine Zeile = 2FA aktiv; keine Zeile = 2FA deaktiviert
CREATE TABLE IF NOT EXISTS public.admin_totp (
  id         BIGSERIAL   PRIMARY KEY,
  secret     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_totp        ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Eigenes Profil lesen"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Eigenes Profil updaten" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products
CREATE POLICY "Produkte öffentlich lesen" ON public.products FOR SELECT USING (active = TRUE);

-- Categories
CREATE POLICY "Kategorien öffentlich lesen" ON public.categories FOR SELECT USING (TRUE);

-- Orders
CREATE POLICY "Eigene Orders lesen" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Order erstellen"     ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items
CREATE POLICY "Eigene Items lesen" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

-- Reviews
CREATE POLICY "Reviews öffentlich lesen" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Review erstellen"         ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Eigene Review updaten"    ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Eigene Review löschen"    ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Tickets
CREATE POLICY "Eigene Tickets lesen" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Ticket erstellen"     ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contact Inquiries (einreichen ohne Login)
CREATE POLICY "Kontaktanfrage einreichen" ON public.contact_inquiries
  FOR INSERT WITH CHECK (consent = TRUE);

-- Shipping Settings (öffentlich lesbar, nur Service-Role schreibt)
CREATE POLICY "Versand lesen"    ON public.shipping_settings FOR SELECT USING (TRUE);
CREATE POLICY "Versand schreiben" ON public.shipping_settings
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ── GRANTS ───────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Öffentliche Leserechte
GRANT SELECT ON public.products          TO anon, authenticated;
GRANT SELECT ON public.categories        TO anon, authenticated;
GRANT SELECT ON public.reviews           TO anon, authenticated;
GRANT SELECT ON public.shipping_settings TO anon, authenticated;
GRANT INSERT ON public.contact_inquiries TO anon, authenticated;

-- Authentifizierte Nutzer
GRANT SELECT, UPDATE         ON public.profiles    TO authenticated;
GRANT SELECT, INSERT         ON public.orders      TO authenticated;
GRANT SELECT, INSERT         ON public.order_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews     TO authenticated;
GRANT SELECT, INSERT         ON public.tickets     TO authenticated;

-- Service Role (Backend & Admin — vollständiger Zugriff)
GRANT ALL ON public.profiles          TO service_role;
GRANT ALL ON public.products          TO service_role;
GRANT ALL ON public.categories        TO service_role;
GRANT ALL ON public.orders            TO service_role;
GRANT ALL ON public.order_items       TO service_role;
GRANT ALL ON public.reviews           TO service_role;
GRANT ALL ON public.tickets           TO service_role;
GRANT ALL ON public.contact_inquiries TO service_role;
GRANT ALL ON public.admin_login_log   TO service_role;
GRANT ALL ON public.shipping_settings TO service_role;
GRANT ALL ON public.admin_totp          TO service_role;
GRANT ALL ON public.push_subscriptions  TO service_role;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
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
