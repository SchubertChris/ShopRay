-- ══════════════════════════════════════════════════════════════════════════════
-- ShopRay — Vollständiges Datenbankschema (konsolidiert, Migrationen 001–035)
-- Stand: 2026-06-28
-- ══════════════════════════════════════════════════════════════════════════════
--
-- FRISCHE INSTALLATION (Neukunde):
--   1. Dieses Script (schema.sql) im Supabase SQL-Editor ausführen — das war's.
--      Es enthält ALLE Migrationen 001–035 (inkl. der Sicherheits-Härtung 035).
--   2. Optional: seed.sql ausführen → Beispieldaten zum Testen
--
-- Die einzelnen migration_XXX.sql Dateien werden für eine Frisch-Installation
-- NICHT benötigt — sie dienen nur dem Update BESTEHENDER Datenbanken (führe dort
-- die Migrationen aus, die du noch nicht eingespielt hast). migration_035 muss
-- auf JEDER bestehenden DB nachgezogen werden (Sicherheit).
--
-- Ausführen: Supabase-Dashboard → SQL Editor → Inhalt einfügen → Run
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════════════════════════════════════════════
-- TABELLEN
-- ════════════════════════════════════════════════════════════════════════════

-- ── PROFILES ─────────────────────────────────────────────────────────────────
-- Erweiterung von auth.users — wird automatisch bei Registrierung angelegt
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT,
  email                TEXT,
  phone                TEXT,
  address_street       TEXT,
  address_zip          TEXT,
  address_city         TEXT,
  address_country      TEXT        DEFAULT 'Deutschland',
  role                 TEXT        NOT NULL DEFAULT 'customer'
                                   CHECK (role IN ('owner', 'admin', 'mod', 'customer')),
  banned_at            TIMESTAMPTZ,
  banned_until         TIMESTAMPTZ,
  ban_reason           TEXT,
  must_change_password BOOLEAN     DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatisch Profil anlegen wenn sich ein User registriert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email);
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
  image_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories ("order", name);

INSERT INTO public.categories (name, "order") VALUES
  ('Wohnen',    0),
  ('Deko',      1),
  ('Küche',     2),
  ('Textilien', 3),
  ('Kunst',     4)
ON CONFLICT (name) DO NOTHING;

-- ── INVOICE SEQUENCE (GoBD / § 14 UStG — atomare, lückenlose Nummerierung) ───
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  prefix   TEXT    NOT NULL,
  year     INTEGER NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, year)
);

CREATE OR REPLACE FUNCTION public.next_invoice_number(
  p_prefix TEXT,
  p_year   INTEGER
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  INSERT INTO public.invoice_sequences (prefix, year, last_seq)
  VALUES (p_prefix, p_year, 1)
  ON CONFLICT (prefix, year)
  DO UPDATE SET last_seq = invoice_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  RETURN p_prefix || '-' || p_year || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.next_invoice_number(TEXT, INTEGER) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.next_invoice_number(TEXT, INTEGER) TO service_role;

-- ── DISCOUNT ATOMIC INCREMENT (Gutschein Race Condition Fix) ──────────────────
CREATE OR REPLACE FUNCTION public.increment_discount_uses(
  p_discount_id UUID,
  p_max_uses    INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.discount_codes
  SET    uses = uses + 1
  WHERE  id = p_discount_id
    AND  (p_max_uses IS NULL OR uses < p_max_uses);

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_discount_uses(UUID, INTEGER) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.increment_discount_uses(UUID, INTEGER) TO service_role;

-- ── ORDERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
  id                        UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number              TEXT          NOT NULL UNIQUE,
  status                    TEXT          NOT NULL DEFAULT 'pending'
                                          CHECK (status IN ('pending','paid','shipped','delivered','cancelled','payment_failed','refunded')),
  total                     NUMERIC(10,2) NOT NULL,
  shipping_address          JSONB,
  stripe_session_id         TEXT,
  stripe_payment_intent_id  TEXT,
  payment_method            TEXT,
  customer_note             TEXT,
  paid_at                   TIMESTAMPTZ,
  shipped_at                TIMESTAMPTZ,
  invoice_number            TEXT          UNIQUE,
  tracking_number           TEXT,
  label_b64                 TEXT,
  discount_code             TEXT,
  discount_amount           NUMERIC(10,2),
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent
  ON public.orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ── ORDER ITEMS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   UUID          REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT          NOT NULL,
  quantity     INTEGER       NOT NULL CHECK (quantity > 0),
  price        NUMERIC(10,2) NOT NULL,
  image_url    TEXT,
  sku_id       UUID,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- ── RETURN REQUESTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.return_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'requested'
                          CHECK (status IN ('requested','approved','rejected','label_sent','received','refunded')),
  label_url   TEXT,
  admin_note  TEXT,
  return_items JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order  ON public.return_requests (order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user   ON public.return_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON public.return_requests (status);

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
-- user_id nullable → Gäste können ebenfalls Tickets erstellen (via guest_email)
CREATE TABLE IF NOT EXISTS public.tickets (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_email TEXT       CHECK (guest_email IS NULL OR guest_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject    TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  category   TEXT        NOT NULL DEFAULT 'other'
                         CHECK (category IN ('order','product','payment','other')),
  status     TEXT        NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open','in_progress','closed')),
  priority   TEXT        NOT NULL DEFAULT 'normal'
                         CHECK (priority IN ('normal','high','urgent')),
  reply      TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tickets_user_or_guest_required CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status  ON public.tickets (status);

-- ── TICKET MESSAGES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID        NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender     TEXT        NOT NULL CHECK (sender IN ('customer', 'admin')),
  text       TEXT        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_created_at_idx
  ON public.ticket_messages (ticket_id, created_at);

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

-- ── SHOP SETTINGS (Singleton-Tabelle) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id          INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name        TEXT        NOT NULL DEFAULT 'Mein Shop',
  description TEXT        DEFAULT '',
  url         TEXT        DEFAULT '',
  email       TEXT        DEFAULT '',
  phone       TEXT        DEFAULT '',
  street      TEXT        DEFAULT '',
  zip         TEXT        DEFAULT '',
  city        TEXT        DEFAULT '',
  country     TEXT        DEFAULT 'Deutschland',
  vat_id      TEXT        DEFAULT '',
  tax_number  TEXT        DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.shop_settings (id, name, description, url, email, country) VALUES
  (1, 'ShopRay', 'Dein Online-Shop', 'https://deinshop.de', 'hello@deinshop.de', 'Deutschland')
ON CONFLICT (id) DO NOTHING;

-- ── ADMIN TOTP (2FA) ─────────────────────────────────────────────────────────
-- Eine Zeile = 2FA aktiv; keine Zeile = 2FA deaktiviert
CREATE TABLE IF NOT EXISTS public.admin_totp (
  id         BIGSERIAL   PRIMARY KEY,
  secret     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ADMIN LOGIN LOG ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_login_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT        NOT NULL,
  user_agent TEXT,
  success    BOOLEAN     NOT NULL DEFAULT TRUE,
  role       TEXT,
  email      TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_login_log_created_at
  ON public.admin_login_log (created_at DESC);

-- ── PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── PENDING MOD INVITES ──────────────────────────────────────────────────────
-- E-Mails eingeladener Mitarbeiter die noch keinen Account haben
CREATE TABLE IF NOT EXISTS public.pending_mod_invites (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        UNIQUE NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ADMIN CONFIG ─────────────────────────────────────────────────────────────
-- Admin-Passwort-Hash (ändert sich via Admin-UI); Fallback = ADMIN_PASSWORD_HASH Env-Var
CREATE TABLE IF NOT EXISTS public.admin_config (
  id            INTEGER     PRIMARY KEY DEFAULT 1,
  password_hash TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── DISCOUNT CODES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT          NOT NULL,
  type       TEXT          NOT NULL CHECK (type IN ('percent', 'fixed')),
  value      NUMERIC(10,2) NOT NULL CHECK (value > 0),
  min_order  NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses   INTEGER,
  uses       INTEGER       NOT NULL DEFAULT 0,
  active     BOOLEAN       NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS discount_codes_code_idx ON public.discount_codes (lower(code));

-- ── PRODUKTVARIANTEN ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.variant_options (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.variant_option_values (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID    NOT NULL REFERENCES public.variant_options(id) ON DELETE CASCADE,
  value     TEXT    NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.product_skus (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  combination  JSONB         NOT NULL,
  stock        INTEGER       NOT NULL DEFAULT 0,
  price_offset NUMERIC(10,2) NOT NULL DEFAULT 0,
  sku_code     TEXT,
  active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- sku_id FK nachrüsten (nach product_skus-Tabelle)
-- (in CREATE TABLE order_items bereits als Spalte definiert, FK hier setzen)
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_sku_id_fkey
  FOREIGN KEY (sku_id) REFERENCES public.product_skus(id) ON DELETE SET NULL
  NOT VALID;

-- ── ADMIN NOTIFICATION CENTER ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  body       TEXT,
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_notification_reads (
  notification_id UUID NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
  user_key        TEXT NOT NULL,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_key)
);

-- ── AUFGABEN-SYSTEM ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  assigned_to UUID,
  priority    TEXT        NOT NULL DEFAULT 'normal'
                          CHECK (priority IN ('low','normal','high','urgent')),
  status      TEXT        NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open','in_progress','done')),
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_totp         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_options          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_option_values    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_skus             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_tasks              ENABLE ROW LEVEL SECURITY;

-- Profiles
DO $$ BEGIN CREATE POLICY "Eigenes Profil lesen"   ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Eigenes Profil updaten" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Products (aktive öffentlich sichtbar)
DO $$ BEGIN CREATE POLICY "Produkte öffentlich lesen" ON public.products FOR SELECT USING (active = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Categories
DO $$ BEGIN CREATE POLICY "Kategorien öffentlich lesen" ON public.categories FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Orders
DO $$ BEGIN CREATE POLICY "Eigene Orders lesen" ON public.orders FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Order erstellen"     ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Order Items
DO $$ BEGIN CREATE POLICY "Eigene Items lesen" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Return Requests
DO $$ BEGIN CREATE POLICY "customer_select_own_returns" ON public.return_requests FOR SELECT
  USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "customer_insert_own_returns" ON public.return_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reviews
DO $$ BEGIN CREATE POLICY "Reviews öffentlich lesen" ON public.reviews FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Review erstellen"         ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Eigene Review updaten"    ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Eigene Review löschen"    ON public.reviews FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tickets (eigene lesen + neu erstellen; Gäste via Backend)
DO $$ BEGIN CREATE POLICY "Eigene Tickets lesen" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Ticket erstellen"     ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ticket Messages
DO $$ BEGIN
  CREATE POLICY "customer_read_own_messages" ON public.ticket_messages FOR SELECT
    USING (ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "customer_insert_own_messages" ON public.ticket_messages FOR INSERT
    WITH CHECK (sender = 'customer' AND ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Contact Inquiries (anonym einreichen)
DO $$ BEGIN CREATE POLICY "Kontaktanfrage einreichen" ON public.contact_inquiries
  FOR INSERT WITH CHECK (consent = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shipping Settings (öffentlich lesen)
DO $$ BEGIN CREATE POLICY "Versand lesen" ON public.shipping_settings FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shop Settings (öffentlich lesen)
DO $$ BEGIN CREATE POLICY "Shop-Infos öffentlich lesen" ON public.shop_settings FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Discount Codes (nur service_role)
DO $$ BEGIN CREATE POLICY "service_discount_codes" ON public.discount_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Varianten (Kunden dürfen lesen, Backend darf alles)
DO $$ BEGIN CREATE POLICY "anon_read_variant_options" ON public.variant_options FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_variant_option_values" ON public.variant_option_values FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_product_skus" ON public.product_skus FOR SELECT USING (active = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "service_variant_options" ON public.variant_options FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "service_variant_option_values" ON public.variant_option_values FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "service_product_skus" ON public.product_skus FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notification Center + Tasks (nur service_role)
DO $$ BEGIN CREATE POLICY "service_notifications_all" ON public.admin_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "service_notification_reads_all" ON public.admin_notification_reads FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "service_tasks_all" ON public.admin_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- GRANTS
-- ════════════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Öffentliche Leserechte
GRANT SELECT ON public.products          TO anon, authenticated;
GRANT SELECT ON public.categories        TO anon, authenticated;
GRANT SELECT ON public.reviews           TO anon, authenticated;
GRANT SELECT ON public.shipping_settings TO anon, authenticated;
GRANT SELECT ON public.shop_settings     TO anon, authenticated;
GRANT INSERT ON public.contact_inquiries TO anon, authenticated;

-- Authentifizierte Nutzer
GRANT SELECT, UPDATE         ON public.profiles         TO authenticated;
GRANT SELECT, INSERT         ON public.orders           TO authenticated;
GRANT SELECT, INSERT         ON public.order_items      TO authenticated;
GRANT SELECT, INSERT         ON public.return_requests  TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews          TO authenticated;
GRANT SELECT, INSERT         ON public.tickets          TO authenticated;
GRANT SELECT, INSERT         ON public.ticket_messages  TO authenticated;

-- Service Role (Backend & Admin — vollständiger Zugriff)
GRANT ALL ON public.profiles            TO service_role;
GRANT ALL ON public.products            TO service_role;
GRANT ALL ON public.categories          TO service_role;
GRANT ALL ON public.orders              TO service_role;
GRANT ALL ON public.order_items         TO service_role;
GRANT ALL ON public.return_requests     TO service_role;
GRANT ALL ON public.reviews             TO service_role;
GRANT ALL ON public.tickets             TO service_role;
GRANT ALL ON public.ticket_messages     TO service_role;
GRANT ALL ON public.contact_inquiries   TO service_role;
GRANT ALL ON public.shipping_settings   TO service_role;
GRANT ALL ON public.shop_settings       TO service_role;
GRANT ALL ON public.admin_totp          TO service_role;
GRANT ALL ON public.admin_login_log     TO service_role;
GRANT ALL ON public.push_subscriptions  TO service_role;
GRANT ALL ON public.pending_mod_invites     TO service_role;
GRANT ALL ON public.admin_config            TO service_role;
GRANT ALL ON public.discount_codes          TO service_role;
GRANT ALL ON public.variant_options         TO service_role;
GRANT ALL ON public.variant_option_values   TO service_role;
GRANT ALL ON public.product_skus            TO service_role;
GRANT ALL ON public.admin_notifications     TO service_role;
GRANT ALL ON public.admin_notification_reads TO service_role;
GRANT ALL ON public.admin_tasks             TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.invoice_sequences TO service_role;

-- Varianten: Kunden dürfen lesen
GRANT SELECT ON public.variant_options       TO anon, authenticated;
GRANT SELECT ON public.variant_option_values TO anon, authenticated;
GRANT SELECT ON public.product_skus          TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════════════
-- TRIGGER: updated_at automatisch setzen
-- ════════════════════════════════════════════════════════════════════════════

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

CREATE TRIGGER set_updated_at_return_requests
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- SUPABASE REALTIME
-- ════════════════════════════════════════════════════════════════════════════

-- Ticket-Chat für Kunden-Frontend in Echtzeit
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- ════════════════════════════════════════════════════════════════════════════
-- INDEXES (neue Tabellen 024–028)
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
  ON public.admin_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notification_reads_user_key
  ON public.admin_notification_reads (user_key);

CREATE INDEX IF NOT EXISTS idx_admin_tasks_status_assigned
  ON public.admin_tasks (status, assigned_to);


-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATIONEN 031–035 (konsolidiert — Teil des Frisch-Installs)
-- Additive Tabellen/Funktionen + idempotente RLS-Härtung. Laufen sauber auf dem
-- oben definierten Schema. Quelle: database/migration_031..035.sql.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 031: team_lead-Rolle + refund_requests (4-Augen-Erstattungen) ─────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'mod', 'team_lead', 'owner', 'admin'));

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number       TEXT NOT NULL,
  amount             NUMERIC(10,2) NOT NULL,
  requested_by       TEXT NOT NULL,
  requested_by_role  TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected')),
  approved_by        TEXT,
  approved_by_role   TEXT,
  approved_at        TIMESTAMPTZ,
  rejected_reason    TEXT,
  stripe_refund_id   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS refund_requests_status_idx   ON public.refund_requests(status);
CREATE INDEX IF NOT EXISTS refund_requests_order_id_idx ON public.refund_requests(order_id);
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_refund_requests" ON public.refund_requests;
CREATE POLICY "service_role_all_refund_requests" ON public.refund_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.refund_requests TO service_role;

-- ── 032: TOTP für Mitarbeiter (Mod + Team Lead) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.mod_totp (
  id         bigserial    PRIMARY KEY,
  user_id    uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret     text         NOT NULL,
  created_at timestamptz  NOT NULL DEFAULT now()
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mod_totp_user_id_unique') THEN
    ALTER TABLE public.mod_totp ADD CONSTRAINT mod_totp_user_id_unique UNIQUE (user_id);
  END IF;
END $$;
GRANT ALL ON public.mod_totp                 TO service_role;
GRANT ALL ON SEQUENCE public.mod_totp_id_seq TO service_role;

-- ── 033: Stock-Reservierungen + atomarer Lagerbestand-Abzug ───────────────────
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text        NOT NULL,
  order_id          uuid        REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id        uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku_id            uuid        REFERENCES public.product_skus(id) ON DELETE SET NULL,
  quantity          int         NOT NULL CHECK (quantity > 0),
  expires_at        timestamptz NOT NULL,
  created_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_res_session ON public.stock_reservations(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_expires ON public.stock_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_res_product ON public.stock_reservations(product_id) WHERE sku_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_res_sku     ON public.stock_reservations(sku_id)     WHERE sku_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity int, p_sku_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_sku_id IS NOT NULL THEN
    UPDATE public.product_skus SET stock = GREATEST(0, stock - p_quantity) WHERE id = p_sku_id;
  ELSE
    UPDATE public.products     SET stock = GREATEST(0, stock - p_quantity) WHERE id = p_product_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_stock(p_stripe_session_id text, p_order_id uuid, p_items jsonb, p_expires_at timestamptz DEFAULT (now() + interval '2 hours'))
RETURNS void LANGUAGE plpgsql AS $$
DECLARE item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.stock_reservations (stripe_session_id, order_id, product_id, sku_id, quantity, expires_at)
    VALUES (p_stripe_session_id, p_order_id, (item->>'product_id')::uuid, NULLIF(item->>'sku_id', '')::uuid, (item->>'quantity')::int, p_expires_at);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_reservation(p_stripe_session_id text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.stock_reservations WHERE stripe_session_id = p_stripe_session_id;
END;
$$;
GRANT ALL     ON TABLE    public.stock_reservations TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_stock     TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_stock       TO service_role;
GRANT EXECUTE ON FUNCTION public.release_reservation TO service_role;

-- ── 034: Atomare Discount-Reservierung (TOCTOU-Fix) ───────────────────────────
CREATE OR REPLACE FUNCTION public.claim_discount(p_code text, p_order_total numeric)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_id uuid; v_type text; v_value numeric; v_amount numeric;
BEGIN
  UPDATE public.discount_codes
  SET    uses = uses + 1
  WHERE  lower(code) = lower(p_code)
    AND  active = true
    AND  (expires_at IS NULL OR expires_at > now())
    AND  (max_uses   IS NULL OR uses < max_uses)
    AND  (min_order  IS NULL OR min_order <= p_order_total)
  RETURNING id, type, value INTO v_id, v_type, v_value;
  IF v_id IS NULL THEN RETURN NULL; END IF;
  IF v_type = 'percent' THEN
    v_amount := round(p_order_total * v_value / 100, 2);
  ELSE
    v_amount := least(v_value, p_order_total);
  END IF;
  RETURN jsonb_build_object('id', v_id, 'type', v_type, 'value', v_value, 'amount', v_amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_discount_claim(p_discount_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.discount_codes SET uses = GREATEST(0, uses - 1) WHERE id = p_discount_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_discount         TO service_role;
GRANT EXECUTE ON FUNCTION public.release_discount_claim TO service_role;

-- ── 035: Security-Härtung (RLS) — PFLICHT ─────────────────────────────────────
-- D1: profiles.role gegen Selbst-Eskalation (Spalten-genaue UPDATE-Rechte);
-- D2: keine Client-Order-Inserts; D3: Kontakt nur über Backend;
-- E2: Produkt-Rating nur aus verifizierten Reviews.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT  UPDATE (name, phone, address_street, address_zip, address_city, address_country)
       ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Order erstellen" ON public.orders;
REVOKE INSERT ON public.orders      FROM authenticated;
REVOKE INSERT ON public.order_items FROM authenticated;

DROP POLICY IF EXISTS "Kontaktanfrage einreichen" ON public.contact_inquiries;
REVOKE INSERT ON public.contact_inquiries FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET
    rating  = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM public.reviews
                        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND verified = TRUE), 0),
    reviews = (SELECT COUNT(*) FROM public.reviews
               WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND verified = TRUE)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════════════
-- ENDE — schema.sql deckt jetzt Migrationen 001–035 vollständig ab.
-- ════════════════════════════════════════════════════════════════════════════
