-- ══════════════════════════════════════════════════════════════════════════════
-- ShopRay — Migration 004: Tabellen-Grants für authenticated & anon
-- ══════════════════════════════════════════════════════════════════════════════
-- Warum nötig:
--   Tabellen die per SQL Editor angelegt wurden bekommen in Supabase KEINE
--   automatischen Grants. RLS-Policies allein reichen nicht — der PostgreSQL-
--   Nutzer braucht zusätzlich explizite GRANT-Rechte auf die Tabelle.
--
-- Fehler ohne dieses Script: HTTP 403 / PostgreSQL-Fehlercode 42501
-- ══════════════════════════════════════════════════════════════════════════════

-- ── SCHEMA-USAGE ─────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ── PROFILES ─────────────────────────────────────────────────────────────────
-- INSERT wird vom Trigger on_auth_user_created übernommen (SECURITY DEFINER)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- ── PRODUCTS ─────────────────────────────────────────────────────────────────
-- Öffentlicher Produktkatalog — alle dürfen lesen
GRANT SELECT ON public.products TO anon, authenticated;

-- ── ORDERS ───────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT ON public.orders TO authenticated;

-- ── ORDER ITEMS ───────────────────────────────────────────────────────────────
GRANT SELECT, INSERT ON public.order_items TO authenticated;

-- ── REVIEWS ──────────────────────────────────────────────────────────────────
-- Lesen dürfen alle (Bewertungen sind öffentlich), schreiben nur Eingeloggte
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

-- ── TICKETS ──────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT ON public.tickets TO authenticated;

-- ── CONTACT INQUIRIES ────────────────────────────────────────────────────────
-- Einreichen ohne Login erlaubt — lesen nur über Service-Key (Admin/Backend)
GRANT INSERT ON public.contact_inquiries TO anon, authenticated;

-- ── SERVICE ROLE — voller Zugriff (Backend / Admin) ─────────────────────────
GRANT ALL ON public.profiles          TO service_role;
GRANT ALL ON public.products          TO service_role;
GRANT ALL ON public.orders            TO service_role;
GRANT ALL ON public.order_items       TO service_role;
GRANT ALL ON public.reviews           TO service_role;
GRANT ALL ON public.tickets           TO service_role;
GRANT ALL ON public.contact_inquiries TO service_role;

-- ── SEQUENCES (für uuid-lose Zähler falls vorhanden) ────────────────────────
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
