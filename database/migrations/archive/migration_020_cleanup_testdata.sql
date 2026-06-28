-- Migration 020: Test-Daten bereinigen
-- Löscht alle Fake-Inhalte. Produkte, Kunden, Mitarbeiter, Kategorien, Settings bleiben.
-- Ausführen in: Supabase → SQL Editor

-- ── Transaktionale Reihenfolge (FK-Abhängigkeiten beachten) ──────────────────

-- 1. Chat-Nachrichten (hängt an tickets)
DELETE FROM public.ticket_messages;

-- 2. Tickets
DELETE FROM public.tickets;

-- 3. Bestellpositionen (hängt an orders)
DELETE FROM public.order_items;

-- 4. Bestellungen
DELETE FROM public.orders;

-- 5. Bewertungen
DELETE FROM public.reviews;

-- 6. Kontakt-Anfragen
DELETE FROM public.contact_inquiries;

-- 7. Login-Log (Admin)
DELETE FROM public.admin_login_log;

-- ── 3 realistische Muster-Bewertungen einfügen ───────────────────────────────
-- Wählt dynamisch die ersten 3 Produkte + ersten 3 Kunden (kein Moderator/Admin).
-- Schlägt sicher fehl, wenn weniger als 3 Produkte oder Kunden existieren.

DO $$
DECLARE
  v_products UUID[];
  v_users    UUID[];
BEGIN
  -- Erste 3 aktive Produkte
  SELECT ARRAY(
    SELECT id FROM public.products WHERE active = TRUE ORDER BY created_at LIMIT 3
  ) INTO v_products;

  -- Erste 3 Kunden (kein admin/moderator)
  SELECT ARRAY(
    SELECT id FROM public.profiles
    WHERE role NOT IN ('admin', 'moderator')
    ORDER BY created_at LIMIT 3
  ) INTO v_users;

  IF array_length(v_products, 1) < 3 OR array_length(v_users, 1) < 3 THEN
    RAISE NOTICE 'Weniger als 3 Produkte oder Kunden — Bewertungen werden übersprungen.';
    RETURN;
  END IF;

  INSERT INTO public.reviews (product_id, user_id, rating, title, body, verified)
  VALUES
    (
      v_products[1], v_users[1], 5,
      'Absolut begeistert',
      'Die Qualität hat mich wirklich überrascht — schnelle Lieferung, tolles Produkt. Kann ich nur weiterempfehlen.',
      TRUE
    ),
    (
      v_products[2], v_users[2], 4,
      'Sehr zufrieden',
      'Gutes Preis-Leistungs-Verhältnis. Verpackung war einwandfrei, alles hat gepasst. Einen Stern Abzug wegen etwas längerer Lieferzeit.',
      TRUE
    ),
    (
      v_products[3], v_users[3], 5,
      'Genau was ich gesucht habe',
      'Super schnell geliefert und genau wie beschrieben. Werde hier auf jeden Fall wieder bestellen.',
      TRUE
    );

  RAISE NOTICE 'Fertig: Alle Fake-Daten gelöscht, 3 Bewertungen eingefügt.';
END;
$$;
