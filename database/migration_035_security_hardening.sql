-- ════════════════════════════════════════════════════════════════════════════
-- Migration 035 — Security Hardening (RLS & Produkt-Rating)
--
-- Behebt vier vom Code-Audit BESTÄTIGTE Lücken:
--   D1  profiles : authenticated konnte die eigene `role` auf 'owner' setzen
--                  → Privileg-Eskalation zum Admin (RLS-UPDATE ohne Spaltenschutz)
--   D2  orders   : authenticated konnte per Direkt-Insert Fake-Orders (status='paid')
--                  ohne echte Zahlung anlegen
--   D3  contact  : anon konnte das Backend-Rate-Limit per Direkt-Insert umgehen (Spam)
--   E2  rating   : Produkt-Rating/-Anzahl zählten auch UNVERIFIZIERTE Reviews mit
--
-- Idempotent — kann gefahrlos erneut ausgeführt werden.
-- Ausführen in Supabase: SQL Editor → Inhalt einfügen → Run.
-- ════════════════════════════════════════════════════════════════════════════


-- ── D1: profiles.role gegen Selbst-Eskalation schützen ───────────────────────
-- Spalten-genaue Rechte: authenticated darf NUR eigene Stammdaten ändern,
-- niemals role / banned_* / must_change_password / email / id / created_at.
-- Das Backend (service_role, GRANT ALL) promotet Rollen weiterhin uneingeschränkt.
-- Die RLS-Policy "Eigenes Profil updaten" (USING auth.uid()=id) bleibt bestehen
-- und sorgt zusätzlich dafür, dass nur die EIGENE Zeile betroffen ist.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT  UPDATE (name, phone, address_street, address_zip, address_city, address_country)
       ON public.profiles TO authenticated;


-- ── D2: Direkte Order-Erstellung durch Clients unterbinden ───────────────────
-- Orders entstehen ausschließlich serverseitig (Backend /api/orders/checkout via
-- service_role) NACH erfolgreicher Stripe-Zahlung. Das Lesen der eigenen Orders
-- (RLS-Policy "Eigene Orders lesen") bleibt unverändert erhalten.
DROP POLICY IF EXISTS "Order erstellen" ON public.orders;
REVOKE INSERT ON public.orders      FROM authenticated;
REVOKE INSERT ON public.order_items FROM authenticated;  -- hatte ohnehin keine INSERT-Policy


-- ── D3: Kontaktanfragen nur noch über das (rate-limitierte) Backend ──────────
-- Der Direkt-Insert via anon-Key umging contactRateLimit komplett → Spam-Vektor.
-- Das Frontend nutzt bereits POST /api/contact (service_role), daher entsteht
-- KEIN Funktionsverlust.
DROP POLICY IF EXISTS "Kontaktanfrage einreichen" ON public.contact_inquiries;
REVOKE INSERT ON public.contact_inquiries FROM anon, authenticated;


-- ── E2: Produkt-Rating nur aus VERIFIZIERTEN Reviews berechnen ───────────────
-- Bisher zählte die Trigger-Funktion alle Reviews (auch verified=false), sodass
-- unmoderierte Bewertungen sofort den öffentlich angezeigten Durchschnitt und die
-- Anzahl beeinflussten. Filter `verified = TRUE` ergänzt; COALESCE(...,0) statt NULL.
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET
    rating  = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM public.reviews
                        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
                          AND verified = TRUE), 0),
    reviews = (SELECT COUNT(*) FROM public.reviews
               WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
                 AND verified = TRUE)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger on_review_change zeigt bereits auf diese Funktion → keine Änderung nötig.

-- Einmaliger Backfill: nur Produkte mit tatsächlich vorhandenen Review-Zeilen
-- neu berechnen. Produkte OHNE Reviews (z.B. Seed-Demo-Produkte mit fest
-- hinterlegtem Rating) bleiben unangetastet, damit der Demo-Shop nicht plötzlich
-- überall "0 Bewertungen" anzeigt.
UPDATE public.products p
SET
  rating  = COALESCE((SELECT ROUND(AVG(r.rating)::NUMERIC, 1) FROM public.reviews r
                      WHERE r.product_id = p.id AND r.verified = TRUE), 0),
  reviews = (SELECT COUNT(*) FROM public.reviews r
             WHERE r.product_id = p.id AND r.verified = TRUE)
WHERE EXISTS (SELECT 1 FROM public.reviews r WHERE r.product_id = p.id);
