-- ═══════════════════════════════════════════════════════════════════
-- CANDLESCOPE — Produkt-Seed v2
-- Ausführung: supabase db query --linked --file supabase/seeds/001_candlescope_products.sql
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. AUFRÄUMEN (richtige Reihenfolge wegen FK-Constraints) ────────
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM reviews;
DELETE FROM variant_option_values;
DELETE FROM product_skus;
DELETE FROM variant_options;
DELETE FROM products;
DELETE FROM categories;


-- ── 2. KATEGORIEN ───────────────────────────────────────────────────
INSERT INTO categories (name, "order", image_url) VALUES
  ('Merch',  1, NULL),
  ('Kurse',  2, NULL);


-- ── 3. PRODUKTE ─────────────────────────────────────────────────────

INSERT INTO products (
  slug, name, description,
  price, old_price, badge, discount,
  rating, reviews, category,
  stock, image_url, tax_rate,
  highlights, rich_description,
  active
)
VALUES

-- ── MERCH ──────────────────────────────────────────────────────────

(
  'candlescope-schluesselanhaenger',
  'Candlescope Schlüsselanhänger',
  'Hochwertiger Metallanhänger mit geprägtem Candlescope-Logo. Perfekter Begleiter für jeden Tag.',
  12.99, NULL, 'Neu', NULL,
  4.8, 12,
  'Merch',
  200, NULL, 19,
  '["Langlebiger Zinkdruckguss","Geprägtes Logo","Gold-Finish","Ideal als Geschenk"]'::jsonb,
  '<p>Der Candlescope Schlüsselanhänger ist mehr als ein Accessoire — er ist ein Statement. Gefertigt aus hochwertigem Zinkdruckguss mit elegantem Gold-Finish trägt er das Candlescope-Logo als geprägtes Relief.</p><p>Maße: ca. 4 × 2,5 cm. Gewicht: ca. 18 g.</p>',
  true
),

(
  'candlescope-shirt',
  'Candlescope Shirt',
  'Premium Baumwoll-Shirt mit minimalistischem Candlescope-Logo-Print. Unisex, zeitlos, hochwertig.',
  34.99, NULL, NULL, NULL,
  4.7, 8,
  'Merch',
  0, NULL, 19,
  '["100 % Bio-Baumwolle","Unisex-Schnitt","Minimalistisches Logo-Print","Waschbar bis 40°C"]'::jsonb,
  '<p>Das Candlescope Shirt überzeugt durch schlichte Eleganz. 100 % Bio-Baumwolle, Grammatur 220 g/m², Unisex-Schnitt. Verfügbar in den Größen S bis XXL.</p>',
  true
),

(
  'candlescope-pullover',
  'Candlescope Pullover',
  'Schwerer Baumwoll-Pullover in Candlescope-Ästhetik. Warm, premium, minimalistisch.',
  54.99, NULL, NULL, NULL,
  4.9, 5,
  'Merch',
  0, NULL, 19,
  '["380 g/m² Schweres Fleece","Brushed Innenseite","Gerippte Bündchen","Oversized-Fit"]'::jsonb,
  '<p>Der Candlescope Pullover ist für alle, die Qualität spüren wollen. 380 g/m² schweres Fleece, gebürstete Innenseite für maximalen Komfort. Oversized-Fit, Unisex. Größen S bis XXL.</p>',
  true
),

(
  'candlescope-sticker-set',
  'Sticker-Set "Candlescope"',
  '5 hochwertige Vinyl-Sticker mit Candlescope-Designs. Wasserfest, UV-beständig — für Laptop, Notizbuch, überall.',
  8.99, NULL, 'Bestseller', NULL,
  4.9, 27,
  'Merch',
  500, NULL, 19,
  '["5 Sticker im Set","100 % wasserfest","UV-beständig","Keine Rückstände beim Ablösen"]'::jsonb,
  '<p>Fünf sorgfältig gestaltete Vinyl-Sticker im Candlescope-Stil. Jeder Sticker ist wasserfest laminiert und UV-beständig — hält Jahre auf Laptop, Thermosflasche oder Notizbuch.</p><p>Größen von 5 × 5 cm bis 8 × 4 cm.</p>',
  true
),

-- ── KURSE ──────────────────────────────────────────────────────────

(
  'kurs-windows-claude-code',
  'Windows + Claude Code — Komplettpaket',
  'Von Null zum produktiven KI-Workflow auf Windows. Setup, Claude Code, Agenten, Automatisierung — alles drin.',
  97.00, 149.00, 'Bestseller', '-35%',
  4.9, 34,
  'Kurse',
  9999, NULL, 19,
  '["Lifetime-Zugang","Windows-spezifisch — kein Mac-Gefummel","Claude Code von Grund auf","KI-Agenten selbst bauen","Kostenlose Updates"]'::jsonb,
  '<p>Der einzige Kurs der Windows-Nutzer wirklich ernst nimmt. Du lernst Claude Code von der Installation bis zum eigenen Agenten-Workflow — ohne Umwege über Mac-only Tutorials.</p><h3>Was dich erwartet</h3><ul><li>Windows-Setup &amp; Terminal-Konfiguration</li><li>Claude Code Installation &amp; erste Schritte</li><li>Eigene Agenten bauen und automatisieren</li><li>Produktiver Workflow für den Alltag</li></ul>',
  true
),

(
  'kurs-trading-anfaenger',
  'Trading für Anfänger — Grundkurs',
  'Lerne die Grundlagen des Tradings ohne Bullshit. Technische Analyse, Risikomanagement, dein erster Trade.',
  127.00, 197.00, 'Neu', '-35%',
  4.8, 19,
  'Kurse',
  9999, NULL, 19,
  '["Für absolute Anfänger","Ohne Vorerfahrung","Technische Analyse verständlich erklärt","Risikomanagement als Kern","Lifetime-Zugang"]'::jsonb,
  '<p>Kein Hype, kein "werde reich in 30 Tagen". Dieser Kurs erklärt Trading so wie es wirklich ist — mit Risikomanagement als Fundament, nicht als Fußnote.</p><h3>Inhalt</h3><ul><li>Wie Märkte wirklich funktionieren</li><li>Charts lesen (Technische Analyse)</li><li>Risikomanagement &amp; Positionsgrößen</li><li>Dein erster Trade live begleitet</li><li>Psychologie im Trading</li></ul>',
  true
),

(
  'prompt-starter-kit',
  'Prompt Starter Kit',
  '50 sofort einsetzbare Prompts für Claude, ChatGPT &amp; Co. — für Entwickler, Freelancer und Lernende.',
  19.99, NULL, NULL, NULL,
  4.8, 41,
  'Kurse',
  9999, NULL, 19,
  '["50 getestete Prompts","Als Notion-Template & PDF","Sofortiger Download","Kostenlose Updates"]'::jsonb,
  '<p>50 Prompts die wirklich funktionieren — nicht die generischen Copy-Paste-Listen die überall kursieren. Jeder Prompt kommt mit Erklärung, Variante und Beispiel-Output.</p><p><strong>Kategorien:</strong> Coding &amp; Debugging · Business &amp; Texte · Lernen &amp; Recherche · Produktivität · Trading-Analyse</p>',
  true
),

(
  'trading-journal-template',
  'Trading Journal — Notion Template',
  'Professionelles Trading-Journal als Notion-Template. Trades tracken, Fehler erkennen, besser werden.',
  14.99, NULL, NULL, NULL,
  4.7, 16,
  'Kurse',
  9999, NULL, 19,
  '["Sofortiger Notion-Zugang","Trade-Tracking mit Statistiken","Psychologie-Log","Wochen- & Monats-Review"]'::jsonb,
  '<p>Das Trading Journal das professionelle Trader nutzen — jetzt als fertiges Notion-Template. Tracke jeden Trade, erkenne Muster in deinen Fehlern und werde systematisch besser.</p><p>Perfekte Ergänzung zum <strong>Trading für Anfänger</strong> Kurs.</p>',
  true
);


-- ── 4. VARIANTEN: SHIRT ─────────────────────────────────────────────

INSERT INTO variant_options (product_id, name, position)
SELECT id, 'Größe', 1 FROM products WHERE slug = 'candlescope-shirt';

INSERT INTO variant_option_values (option_id, value, position)
SELECT vo.id, v.value, v.pos
FROM variant_options vo
JOIN products p ON p.id = vo.product_id AND p.slug = 'candlescope-shirt'
CROSS JOIN (VALUES ('S',1),('M',2),('L',3),('XL',4),('XXL',5)) AS v(value, pos);

INSERT INTO product_skus (product_id, combination, stock, price_offset, sku_code, active)
SELECT
  p.id,
  jsonb_build_object('Größe', vov.value),
  30, 0,
  'CS-SHIRT-' || vov.value,
  true
FROM products p
JOIN variant_options vo ON vo.product_id = p.id
JOIN variant_option_values vov ON vov.option_id = vo.id
WHERE p.slug = 'candlescope-shirt';


-- ── 5. VARIANTEN: PULLOVER ──────────────────────────────────────────

INSERT INTO variant_options (product_id, name, position)
SELECT id, 'Größe', 1 FROM products WHERE slug = 'candlescope-pullover';

INSERT INTO variant_option_values (option_id, value, position)
SELECT vo.id, v.value, v.pos
FROM variant_options vo
JOIN products p ON p.id = vo.product_id AND p.slug = 'candlescope-pullover'
CROSS JOIN (VALUES ('S',1),('M',2),('L',3),('XL',4),('XXL',5)) AS v(value, pos);

INSERT INTO product_skus (product_id, combination, stock, price_offset, sku_code, active)
SELECT
  p.id,
  jsonb_build_object('Größe', vov.value),
  20, 0,
  'CS-PULL-' || vov.value,
  true
FROM products p
JOIN variant_options vo ON vo.product_id = p.id
JOIN variant_option_values vov ON vov.option_id = vo.id
WHERE p.slug = 'candlescope-pullover';


-- ── 6. ERGEBNIS PRÜFEN ──────────────────────────────────────────────
SELECT
  p.name,
  p.category,
  p.price,
  p.stock,
  p.badge,
  COUNT(ps.id) AS skus
FROM products p
LEFT JOIN product_skus ps ON ps.product_id = p.id
GROUP BY p.id, p.name, p.category, p.price, p.stock, p.badge
ORDER BY p.category, p.price;
