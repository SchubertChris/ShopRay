-- ══════════════════════════════════════════════════════════════════════════════
-- ShopRay — Demo-Seed: Supplements / Fitness-Shop
-- Stand: 2026-05-17
-- ══════════════════════════════════════════════════════════════════════════════
--
-- AUSFÜHREN:
--   Supabase Dashboard → SQL Editor
--   https://supabase.com/dashboard/project/ikopnwugsohiehzpxxzu/sql/new
--   Inhalt einfügen → Run
--
-- WAS DIESES SCRIPT TUT:
--   1. Alle Shop-Daten leeren (Produkte, Kategorien, Bestellungen, Bewertungen …)
--   2. 6 Kategorien anlegen
--   3. 12 Supplement-Produkte anlegen (inkl. LMIV für Protein)
--
-- WAS DIESES SCRIPT NICHT ANFASST:
--   - profiles (User-Accounts bleiben erhalten)
--   - shipping_settings (Singleton — bleibt)
--   - admin_totp (2FA-Config — bleibt)
--
-- BEWERTUNGEN: user_id ist NOT NULL → manuell über Frontend testen
-- ══════════════════════════════════════════════════════════════════════════════


-- ── SCHRITT 1: Daten leeren ───────────────────────────────────────────────────

TRUNCATE TABLE
  reviews,
  order_items,
  orders,
  contact_inquiries,
  tickets,
  admin_login_log,
  products,
  categories
CASCADE;


-- ── SCHRITT 2: Kategorien ─────────────────────────────────────────────────────

INSERT INTO public.categories (name, "order") VALUES
  ('Protein',               1),
  ('Vitamine & Mineralien', 2),
  ('Pre-Workout',           3),
  ('Aminosäuren',           4),
  ('Creatin',               5),
  ('Zubehör',               6);


-- ── SCHRITT 3: Produkte ───────────────────────────────────────────────────────

INSERT INTO public.products (
  name, slug, description,
  price, old_price, badge, discount,
  rating, reviews, category, stock, tax_rate,
  highlights, certifications, lmiv
) VALUES

-- ─────────────────────────────────────────────────────────────
-- PROTEIN
-- ─────────────────────────────────────────────────────────────

(
  'Whey Protein Schokolade 1 kg',
  'whey-protein-schokolade-1kg',
  'Premium Molkenprotein-Isolat mit 80 % Eiweißanteil und unschlagbarem Schokoladengeschmack. Ideal für Muskelaufbau und schnelle Regeneration nach dem Training.',
  49.90, 59.90, 'Bestseller', '-17%',
  4.8, 247, 'Protein', 156, 19,
  '["24 g Protein pro Portion", "Nur 1,8 g Fett", "Schnell resorbierend", "33 Portionen je Packung", "Glutenfrei"]',
  '["Informed Sport", "Laktosearm"]',
  '{
    "ingredients": "Molkenprotein-Konzentrat (Milch), Kakaopulver (10 %), Emulgator: Lecithin (Soja), natürliches Aroma, Süßungsmittel: Sucralose.",
    "allergens": ["Milch", "Soja"],
    "servingSize": "30 g (1 Messlöffel)",
    "netContent": "1000 g",
    "nutrients": [
      {"name": "Energie",             "per100g": "1565 kJ / 374 kcal", "perServing": "469 kJ / 112 kcal"},
      {"name": "Fett",                "per100g": "6,0 g",              "perServing": "1,8 g"},
      {"name": "davon gesättigte FS", "per100g": "2,5 g",              "perServing": "0,8 g"},
      {"name": "Kohlenhydrate",       "per100g": "7,2 g",              "perServing": "2,2 g"},
      {"name": "davon Zucker",        "per100g": "4,8 g",              "perServing": "1,4 g"},
      {"name": "Eiweiß",              "per100g": "80,0 g",             "perServing": "24,0 g", "nrv": "48 %"},
      {"name": "Salz",                "per100g": "0,48 g",             "perServing": "0,14 g"}
    ],
    "usage": "1 Messlöffel (30 g) in 300 ml Wasser oder Milch einrühren. Empfohlen direkt nach dem Training.",
    "storageHint": "Kühl und trocken lagern. Nach dem Öffnen innerhalb von 3 Monaten aufbrauchen.",
    "warnings": [
      "Nahrungsergänzungsmittel sind kein Ersatz für eine ausgewogene Ernährung.",
      "Nicht für Kinder unter 15 Jahren geeignet.",
      "Die empfohlene Tagesdosis nicht überschreiten."
    ],
    "manufacturer": "SportNutrition GmbH, Musterstraße 12, 80331 München"
  }'::jsonb
),

(
  'Casein Protein Vanilla Night 750 g',
  'casein-protein-vanilla-750g',
  'Langsam verdauliches Mizellar-Casein für optimale Proteinversorgung über Nacht. Cremig-vanillige Textur, lässt sich auch als Pudding zubereiten.',
  44.90, NULL, 'NEU', NULL,
  4.6, 42, 'Protein', 88, 19,
  '["28 g Protein pro Portion", "Langsame Freisetzung über 7 Stunden", "Ideal vor dem Schlafen", "25 Portionen", "Ohne Aspartam"]',
  '["Informed Sport"]',
  NULL
),

(
  'Plant Protein Erdnuss-Caramel 600 g',
  'plant-protein-erdnuss-caramel-600g',
  'Veganes Hochprotein-Blend aus Erbsenprotein, Reisprotein und Sonnenblumenprotein. Vollständiges Aminosäureprofil, 100 % pflanzlich und bio-zertifiziert.',
  52.90, NULL, 'Vegan', NULL,
  4.7, 118, 'Protein', 64, 19,
  '["22 g Protein pro Portion", "Alle 9 essenziellen Aminosäuren", "Bio-zertifiziert", "Sojafrei", "20 Portionen"]',
  '["Vegan", "Bio-zertifiziert", "Sojafrei"]',
  NULL
),

-- ─────────────────────────────────────────────────────────────
-- VITAMINE & MINERALIEN
-- ─────────────────────────────────────────────────────────────

(
  'Vitamin D3 5000 IU + K2 MK-7 200 µg',
  'vitamin-d3-k2-mk7',
  'Hochdosiertes Vitamin D3 kombiniert mit bioaktivem Vitamin K2 MK-7. Für Knochen, Immunsystem und Muskelfunktion. 365 Tages-Versorgung in einer Packung.',
  18.90, 24.90, 'Top-Seller', '-24%',
  4.9, 512, 'Vitamine & Mineralien', 320, 19,
  '["365 Portionen pro Packung", "D3 aus Lanolin — hochbioverfügbar", "K2 als MK-7 (all-trans)", "Kokosöl als Träger", "Laborgeprüft"]',
  '["Laborgeprüft", "Glutenfrei", "Laktosefrei"]',
  NULL
),

(
  'Omega-3 Fischöl 1000 mg — 180 Kapseln',
  'omega-3-fischoel-1000mg-180',
  'Hochreines Omega-3-Fischöl aus Kaltwasserfischen mit 600 mg EPA und 400 mg DHA pro Tagesdosis. IFOS 5-Sterne-zertifiziert für höchste Reinheit.',
  22.90, NULL, NULL, NULL,
  4.7, 234, 'Vitamine & Mineralien', 145, 19,
  '["1000 mg Omega-3 pro Kapsel", "600 mg EPA + 400 mg DHA täglich", "IFOS 5-Sterne-zertifiziert", "Nachhaltig gefischt", "60 Tagesdosen"]',
  '["IFOS 5-Sterne", "MSC-zertifiziert"]',
  NULL
),

(
  'Magnesium Komplex 400 mg — 120 Kapseln',
  'magnesium-komplex-400mg-120',
  '3-fach-Magnesium-Komplex aus Magnesiumglycinat, Magnesiummalat und Magnesiumcitrat. Maximale Bioverfügbarkeit ohne Magnesiumoxid. Gegen Müdigkeit und Muskelkrämpfe.',
  16.90, NULL, NULL, NULL,
  4.6, 189, 'Vitamine & Mineralien', 200, 19,
  '["3-fach-Magnesium-Blend", "Ohne Magnesiumoxid", "Hochbioverfügbar", "60 Tagesdosen", "Laborgeprüft"]',
  '["Glutenfrei", "Vegan", "Laborgeprüft"]',
  NULL
),

(
  'Multivitamin Pro Complete — 60 Kapseln',
  'multivitamin-pro-complete-60',
  'Vollspektrum-Multivitamin mit 26 Vitaminen und Mineralstoffen in bioaktiver Form. Methylfolat statt Folsäure, Methylcobalamin (B12) und Vitamin D3.',
  29.90, NULL, 'NEU', NULL,
  4.8, 28, 'Vitamine & Mineralien', 155, 19,
  '["26 Vitamine & Mineralstoffe", "Bioaktive Formen", "Methylcobalamin B12", "60 Tagesdosen", "Ohne Füllstoffe"]',
  '["Laborgeprüft", "Vegan"]',
  NULL
),

-- ─────────────────────────────────────────────────────────────
-- PRE-WORKOUT
-- ─────────────────────────────────────────────────────────────

(
  'Pre-Workout IGNITE Watermelon 400 g',
  'pre-workout-ignite-watermelon-400g',
  'Hochdosierter Pre-Workout-Booster mit 300 mg Koffein, 4 g Beta-Alanin und 6 g Citrullin Malat. Maximale Energie, Fokus und Pump für intensive Trainingseinheiten.',
  39.90, NULL, 'HOT', NULL,
  4.7, 156, 'Pre-Workout', 72, 19,
  '["300 mg Koffein pro Portion", "6 g Citrullin Malat", "4 g Beta-Alanin", "200 mg L-Theanin", "40 Portionen"]',
  '["Laborgeprüft", "Informed Sport"]',
  NULL
),

-- ─────────────────────────────────────────────────────────────
-- AMINOSÄUREN
-- ─────────────────────────────────────────────────────────────

(
  'BCAA 2:1:1 Tropical Punch 300 g',
  'bcaa-211-tropical-punch-300g',
  'Instantisierte BCAAs im optimalen 2:1:1-Verhältnis (Leucin:Isoleucin:Valin). Elektrisch-frischer Tropical-Punch-Geschmack. Ideal intra- oder post-workout.',
  27.90, 34.90, NULL, '-20%',
  4.5, 89, 'Aminosäuren', 112, 19,
  '["6 g BCAAs pro Portion", "2:1:1 Verhältnis (L:I:V)", "Instantisiert", "Ohne Aspartam", "50 Portionen"]',
  '["Laborgeprüft", "Glutenfrei"]',
  NULL
),

(
  'L-Glutamin 100 % 500 g',
  'l-glutamin-500g',
  'Pharmaceutical-grade L-Glutamin in höchster Reinheit. Unterstützt Regeneration, Immunsystem und Darmgesundheit. Geschmacksneutral, lässt sich jedem Shake beimischen.',
  24.90, NULL, NULL, NULL,
  4.4, 67, 'Aminosäuren', 95, 19,
  '["100 % reines L-Glutamin", "Pharmazeutische Qualität", "Geschmacksneutral", "100 Portionen à 5 g", "Vegan"]',
  '["Vegan", "Laborgeprüft"]',
  NULL
),

-- ─────────────────────────────────────────────────────────────
-- CREATIN
-- ─────────────────────────────────────────────────────────────

(
  'Creatin Monohydrat mikronisiert 500 g',
  'creatin-monohydrat-500g',
  'Reines, mikronisiertes Creatin Monohydrat in Creapure®-Qualität. Der am besten erforschte Wirkstoff im Sport. Hergestellt in Deutschland, geschmacksneutral.',
  22.90, NULL, 'Bestseller', NULL,
  4.9, 334, 'Creatin', 245, 19,
  '["Creapure® zertifiziert", "Mikronisiert — superlöslich", "250 Portionen à 2 g", "In Deutschland hergestellt", "Geschmacksneutral"]',
  '["Creapure®", "Vegan", "Laborgeprüft"]',
  NULL
),

-- ─────────────────────────────────────────────────────────────
-- ZUBEHÖR
-- ─────────────────────────────────────────────────────────────

(
  'Premium Shaker Pro 700 ml',
  'premium-shaker-pro-700ml',
  'Auslaufsicherer Protein-Shaker mit patentiertem Flip-Cap und integriertem BlenderBall-Drahtmixer. BPA-frei, spülmaschinengeeignet.',
  12.90, NULL, NULL, NULL,
  4.6, 203, 'Zubehör', 380, 19,
  '["700 ml Fassungsvermögen", "Auslaufsicherer Flip-Cap", "BlenderBall-Drahtmixer", "BPA-freier Kunststoff", "Spülmaschinengeeignet"]',
  '["BPA-frei"]',
  NULL
);


-- ── FERTIG ────────────────────────────────────────────────────────────────────
-- 6 Kategorien + 12 Produkte angelegt.
-- Nächste Schritte:
--   1. Admin-Panel → Produkte → Bilder hochladen (Supabase Storage)
--   2. Als User registrieren → Bewertungen schreiben (über Frontend testen)
--   3. Test-Bestellung aufgeben (Stripe-Karte: 4242 4242 4242 4242)
-- ══════════════════════════════════════════════════════════════════════════════
