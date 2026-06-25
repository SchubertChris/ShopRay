-- ═══════════════════════════════════════════════════════════════════
-- CANDLESCOPE — Produkt-Seed v3 (erweitert)
-- Ausführung: Supabase SQL Editor — gesamte Datei einfügen + Run
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
  ('Merch',   1, 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400&q=85&auto=format&fit=crop'),
  ('Kurse',   2, 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1400&q=85&auto=format&fit=crop'),
  ('Bundles', 3, 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=85&auto=format&fit=crop'),
  ('Tools',   4, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=85&auto=format&fit=crop');


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

-- ════════════════════════════════════════
--  MERCH
-- ════════════════════════════════════════

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
  'candlescope-hoodie',
  'Candlescope Hoodie',
  'Schwerer Kapuzenpullover mit eingenähtem Känguru-Pocket und geprägtem Logo auf der Brust. Das Upgrade zum Pullover.',
  69.99, 89.99, 'Neu', '-22%',
  4.8, 3,
  'Merch',
  0, NULL, 19,
  '["400 g/m² Premium-Fleece","Doppellagige Kapuze","Känguru-Tasche","Metall-Reißverschluss Kordeln","Unisex Oversized-Fit"]'::jsonb,
  '<p>Der Candlescope Hoodie setzt den Standard neu. 400 g/m² Premium-Fleece, doppellagige Kapuze ohne Tunnelzug-Knoten, Metallösen für die Kordeln und ein subtil geprägtes Logo auf der linken Brust.</p><p>Unisex Oversized-Fit, Größen S bis XXL. Waschbar bis 40°C auf links gedreht.</p>',
  true
),

(
  'candlescope-beanie',
  'Candlescope Beanie',
  'Weiche Strickmütze mit gesticktem Candlescope-Logo. One-Size, passt immer.',
  24.99, NULL, NULL, NULL,
  4.6, 7,
  'Merch',
  150, NULL, 19,
  '["100 % Acryl-Strick","Gestickte Logoposition","One-Size","Doppellagige Krempe für extra Wärme"]'::jsonb,
  '<p>Die Candlescope Beanie hält warm und sieht gut aus dabei. Weiches Acrylstrick-Material, doppellagige Krempe und ein sauber gesticktes Logo auf der Stirn. One-Size, passt für alle Kopfgrößen.</p>',
  true
),

(
  'candlescope-tote-bag',
  'Candlescope Tote Bag',
  'Robuste Canvas-Tasche mit großflächigem Candlescope-Print. Fasst alles — vom Laptop bis zum Einkauf.',
  22.99, NULL, 'Bestseller', NULL,
  4.9, 21,
  'Merch',
  300, NULL, 19,
  '["400 g/m² schwere Canvas","38 × 42 cm Hauptfach","Lange Henkel (70 cm)","Maschinenwäsche bis 30°C","Innen-Tasche mit Zip"]'::jsonb,
  '<p>Die Candlescope Tote Bag ist der perfekte Alltagsbegleiter. 400 g/m² schwere Natural-Canvas, großflächiger Siebdruck, lange Schulterhenkel und eine versteckte Reißverschlusstasche innen.</p><p>Passt auf einen 15" Laptop, ist maschinenwaschbar und wird mit jedem Waschen nur besser.</p>',
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

(
  'candlescope-kaffeebecher',
  'Candlescope Kaffeebecher',
  'Doppelwandiger Edelstahl-Becher mit Candlescope-Logo. Hält heiße Getränke 8h warm, kalte 12h kalt.',
  29.99, NULL, NULL, NULL,
  4.8, 14,
  'Merch',
  120, NULL, 19,
  '["400 ml Fassungsvermögen","Doppelwand-Vakuumisolierung","BPA-frei","Auslaufsicherer Deckel","Spülmaschinenfest"]'::jsonb,
  '<p>Der Candlescope Kaffeebecher aus doppelwandigem Edelstahl (18/8) hält deinen Kaffee heiß während du Charts studierst. 400 ml, auslaufsicherer Dreh-Deckel, Laser-graviertes Logo.</p><p>Hält Heißgetränke bis zu 8 Stunden warm, Kaltgetränke bis zu 12 Stunden kalt.</p>',
  true
),

(
  'candlescope-poster',
  'Poster "Candlescope — Chart is Life"',
  'Hochwertiger Kunstdruck auf 250 g/m² Matt-Papier. Dein Trading-Setup verdient ein Statement.',
  19.99, NULL, NULL, NULL,
  4.7, 9,
  'Merch',
  200, NULL, 7,
  '["250 g/m² Matt-Fotopapier","Format: 50 × 70 cm","Farbecht & lichtbeständig","Gerollt geliefert (kein Knicken)","7% MwSt. (Kunstdruck)"]'::jsonb,
  '<p>Ein Candlescope-Kunstdruck der dein Setup auf das nächste Level hebt. Gedruckt auf 250 g/m² Matt-Fotopapier mit Pigmenttinten für maximale Farbechtheit und Langlebigkeit.</p><p>Format 50 × 70 cm, gerollt in robuster Versandröhre geliefert. Passend für Standardrahmen (IKEA HOVSTA etc.).</p>',
  true
),


-- ════════════════════════════════════════
--  KURSE
-- ════════════════════════════════════════

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
  'kurs-chartanalyse-masterclass',
  'Chart-Analyse Masterclass',
  'Fortgeschrittene Technische Analyse: Strukturen, Muster, Indikatoren — professionell lesen und handeln.',
  157.00, 247.00, 'Top-Seller', '-36%',
  4.9, 28,
  'Kurse',
  9999, NULL, 19,
  '["Aufbaukurs zum Grundkurs","Support & Resistance professionell","15+ Candlestick-Muster","Elliott-Wellen-Grundlagen","Live-Chart-Analysen als Videos"]'::jsonb,
  '<p>Die Masterclass für alle die den Grundkurs abgeschlossen haben oder bereits erste Trading-Erfahrung mitbringen. Hier geht es tief in die Materie: Marktstruktur, Supply &amp; Demand Zonen, Fibonacci, Ichimoku-Grundlagen.</p><h3>Inhalt</h3><ul><li>Marktstruktur &amp; Smart Money Konzepte</li><li>15+ Candlestick-Muster mit Erfolgsquoten</li><li>Indikatoren richtig einsetzen (RSI, MACD, BB)</li><li>Trendlinien, Kanäle, Dreiecke</li><li>Elliott-Wellen-Einführung</li></ul>',
  true
),

(
  'kurs-trading-psychologie',
  'Trading-Psychologie — Mindset für Märkte',
  'Warum du weißt was zu tun ist — und es trotzdem nicht tust. Die mentale Seite des Tradings.',
  79.00, NULL, NULL, NULL,
  4.8, 11,
  'Kurse',
  9999, NULL, 19,
  '["Verlustangst & FOMO überwinden","Disziplin als System","Journaling-Methode","Mentale Setups vor dem Trade","Für Anfänger & Fortgeschrittene"]'::jsonb,
  '<p>Der Kurs den die meisten zu spät kaufen. Trading ist zu 80 % Psychologie — und dieser Kurs geht genau dorthin, wo es wehtut: Verlustangst, Gier, Overtrading, Revenge-Trading.</p><h3>Inhalt</h3><ul><li>Die 7 häufigsten mentalen Trading-Fehler</li><li>Dein Pre-Trade-Ritual aufbauen</li><li>Stop-Loss setzen und wirklich drin lassen</li><li>Journaling als Performance-Werkzeug</li><li>Flow-State im Trading finden</li></ul>',
  true
),

(
  'kurs-ki-automation',
  'KI-Automation für Selbstständige',
  'Automatisiere deinen Business-Workflow mit Claude, Make.com und n8n. Spar 10+ Stunden pro Woche.',
  117.00, 177.00, 'Neu', '-34%',
  4.9, 7,
  'Kurse',
  9999, NULL, 19,
  '["Kein Coding nötig","Make.com + n8n von Grund auf","Claude API live einsetzen","Eigene Agenten bauen","Für Freelancer & Gründer"]'::jsonb,
  '<p>Dein Business läuft. Aber viele Aufgaben erledigen sich noch manuell — E-Mails, Berichte, Content, Recherche. Dieser Kurs zeigt wie du das mit KI-Automation änderst.</p><h3>Was du lernst</h3><ul><li>Make.com &amp; n8n — No-Code Automation</li><li>Claude API direkt in Workflows einbauen</li><li>E-Mail-Klassifizierung automatisieren</li><li>Content-Pipeline aufbauen</li><li>Eigene Tools mit Claude bauen</li></ul>',
  true
),

(
  'prompt-starter-kit',
  'Prompt Starter Kit',
  '50 sofort einsetzbare Prompts für Claude, ChatGPT & Co. — für Entwickler, Freelancer und Lernende.',
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
),


-- ════════════════════════════════════════
--  TOOLS (digitale Vorlagen & Downloads)
-- ════════════════════════════════════════

(
  'risk-calculator-excel',
  'Risk Calculator — Excel & Google Sheets',
  'Berechne Positionsgröße, Stop-Loss und Risk-Reward-Ratio in Sekunden. Nie wieder manuell rechnen.',
  9.99, NULL, 'Bestseller', NULL,
  4.9, 38,
  'Tools',
  9999, NULL, 19,
  '["Kompatibel mit Excel & Google Sheets","Positionsgrößen-Rechner","Risk-Reward-Visualisierung","Automatische Pip-Berechnung","Mehrere Konten gleichzeitig"]'::jsonb,
  '<p>Der Risk Calculator den jeder Trader braucht — aber kaum jemand hat. Gib Kontostand, Risiko-Prozent und Stop-Loss ein. Der Calculator zeigt dir sofort Positionsgröße, maximaler Verlust und Break-Even-Punkt.</p><p>Funktioniert für Forex, Krypto, Aktien und CFDs. Kompatibel mit Excel 2016+ und Google Sheets.</p>',
  true
),

(
  'watchlist-template',
  'Watchlist & Screener — Excel Template',
  'Professionelle Watchlist mit automatischen Alerts, Sektorübersicht und Performance-Tracking.',
  12.99, NULL, NULL, NULL,
  4.7, 22,
  'Tools',
  9999, NULL, 19,
  '["Live-Kurse via Google Finance","Sektor-Heatmap","Performance vs. Benchmark","Exportierbar als PDF","Wöchentlicher Review-Tab"]'::jsonb,
  '<p>Behalte den Überblick über deine Watchlist. Das Template lädt Kursdaten automatisch via Google Finance, zeigt Sektorgewichtungen und vergleicht deine Auswahl gegen den S&amp;P 500.</p><p>Inkl. wöchentlichem Review-Tab und Notiz-Spalten pro Asset.</p>',
  true
),

(
  'candlestick-spickzettel-pdf',
  'Candlestick-Muster Spickzettel (PDF)',
  '30 der wichtigsten Candlestick-Muster auf einem Blatt. Drucken, aufhängen, immer griffbereit.',
  4.99, NULL, 'Top-Seller', NULL,
  4.9, 67,
  'Tools',
  9999, NULL, 19,
  '["30 Muster mit Zeichnung & Beschreibung","Bullish & Bearish sortiert","A3 druckbereit (300 dpi)","Sofort-Download als PDF","Inkl. Erfolgsquoten"]'::jsonb,
  '<p>Alle wichtigen Candlestick-Muster auf einem einzigen A3-Blatt — Hammer, Doji, Engulfing, Evening Star und 26 weitere. Mit Zeichnung, Beschreibung und historischen Erfolgsquoten.</p><p>300 dpi druckbereit, auch als digitale Referenz am zweiten Monitor nutzbar.</p>',
  true
),

(
  'trading-checkliste-pdf',
  'Trade-Checkliste — Pre & Post Trade PDF',
  '2-seitige PDF-Checkliste die du vor und nach jedem Trade durchgehst. Disziplin als System.',
  3.99, NULL, NULL, NULL,
  4.8, 29,
  'Tools',
  9999, NULL, 19,
  '["Pre-Trade Analyse (9 Punkte)","Post-Trade Review (7 Punkte)","Als PDF zum Ausdrucken","Als ausfüllbares PDF digital nutzbar","Passt zu jedem Trading-System"]'::jsonb,
  '<p>Die einfachste Methode impulsive Trades zu vermeiden: eine Checkliste die du durchgehst bevor du auf Kaufen drückst. 9 Punkte Pre-Trade, 7 Punkte Post-Trade.</p><p>Als druckbares PDF oder am Tablet ausfüllbar. Passt zu jedem Trading-System — Scalping, Swing, Position.</p>',
  true
),


-- ════════════════════════════════════════
--  BUNDLES
-- ════════════════════════════════════════

(
  'bundle-trading-starter',
  'Trading Starter Bundle',
  'Grundkurs + Trading Journal + Spickzettel + Checkliste — alles was du für den Start brauchst.',
  139.99, 211.96, 'Bundle', '-34%',
  4.9, 18,
  'Bundles',
  9999, NULL, 19,
  '["Trading Grundkurs (127 €)","Trading Journal Notion (14,99 €)","Candlestick Spickzettel (4,99 €)","Trade-Checkliste (3,99 €)","Du sparst über 70 €"]'::jsonb,
  '<p>Das komplette Starter-Paket für Trading-Einsteiger. Alles was du für einen strukturierten Start brauchst — in einem Bundle zum Vorzugspreis.</p><h3>Im Bundle enthalten</h3><ul><li>Trading für Anfänger — Grundkurs (127 €)</li><li>Trading Journal — Notion Template (14,99 €)</li><li>Candlestick-Muster Spickzettel PDF (4,99 €)</li><li>Trade-Checkliste PDF (3,99 €)</li></ul><p><strong>Ersparnis: über 70 € gegenüber Einzelkauf.</strong></p>',
  true
),

(
  'bundle-ki-komplett',
  'KI-Komplett Bundle',
  'Windows + Claude Code + KI-Automation + Prompt Starter Kit — dein vollständiger KI-Workflow.',
  189.99, 233.99, 'Bundle', '-19%',
  4.9, 9,
  'Bundles',
  9999, NULL, 19,
  '["Windows + Claude Code Kurs (97 €)","KI-Automation für Selbstständige (117 €)","Prompt Starter Kit (19,99 €)","Du sparst 44 €","Lifetime-Zugang zu allen 3 Produkten"]'::jsonb,
  '<p>Der komplette KI-Workflow in einem Paket. Vom Setup auf Windows, über Claude Code und Agenten, bis zur vollständigen Automation deines Business — alles in einem Bundle.</p><h3>Im Bundle enthalten</h3><ul><li>Windows + Claude Code — Komplettpaket (97 €)</li><li>KI-Automation für Selbstständige (117 €)</li><li>Prompt Starter Kit (19,99 €)</li></ul><p><strong>Ersparnis: 44 € gegenüber Einzelkauf.</strong></p>',
  true
),

(
  'bundle-candlescope-allin',
  'Candlescope All-In Bundle',
  'Alle Kurse + alle Tools in einem Paket. Das maximale Lernpaket für Trader & KI-Enthusiasten.',
  349.99, 562.93, 'Premium Bundle', '-38%',
  4.9, 4,
  'Bundles',
  9999, NULL, 19,
  '["Alle 5 Kurse (inkl. Masterclass & Psychologie)","Alle 4 Tools","Lifetime-Zugang zu allem","Du sparst über 200 €","Priorisierter Support"]'::jsonb,
  '<p>Das Komplettpaket für alle die keine halben Sachen machen. Alle Kurse, alle Tools, einmal kaufen — lebenslang nutzen.</p><h3>Im Bundle enthalten</h3><ul><li>Trading Grundkurs + Masterclass + Psychologie</li><li>Windows + Claude Code + KI-Automation</li><li>Prompt Starter Kit + Trading Journal</li><li>Risk Calculator + Watchlist + Spickzettel + Checkliste</li></ul><p><strong>Ersparnis: über 210 € gegenüber Einzelkauf.</strong></p>',
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


-- ── 6. VARIANTEN: HOODIE ────────────────────────────────────────────

INSERT INTO variant_options (product_id, name, position)
SELECT id, 'Größe', 1 FROM products WHERE slug = 'candlescope-hoodie';

INSERT INTO variant_option_values (option_id, value, position)
SELECT vo.id, v.value, v.pos
FROM variant_options vo
JOIN products p ON p.id = vo.product_id AND p.slug = 'candlescope-hoodie'
CROSS JOIN (VALUES ('S',1),('M',2),('L',3),('XL',4),('XXL',5)) AS v(value, pos);

INSERT INTO product_skus (product_id, combination, stock, price_offset, sku_code, active)
SELECT
  p.id,
  jsonb_build_object('Größe', vov.value),
  25, 0,
  'CS-HOOD-' || vov.value,
  true
FROM products p
JOIN variant_options vo ON vo.product_id = p.id
JOIN variant_option_values vov ON vov.option_id = vo.id
WHERE p.slug = 'candlescope-hoodie';


-- ── 7. VARIANTEN: BEANIE ────────────────────────────────────────────
--  One-Size → kein Größen-Variant nötig, aber Farbe anbieten

INSERT INTO variant_options (product_id, name, position)
SELECT id, 'Farbe', 1 FROM products WHERE slug = 'candlescope-beanie';

INSERT INTO variant_option_values (option_id, value, position)
SELECT vo.id, v.value, v.pos
FROM variant_options vo
JOIN products p ON p.id = vo.product_id AND p.slug = 'candlescope-beanie'
CROSS JOIN (VALUES ('Schwarz',1),('Dunkelgrau',2),('Camel',3)) AS v(value, pos);

INSERT INTO product_skus (product_id, combination, stock, price_offset, sku_code, active)
SELECT
  p.id,
  jsonb_build_object('Farbe', vov.value),
  50, 0,
  'CS-BEAN-' || UPPER(LEFT(vov.value, 3)),
  true
FROM products p
JOIN variant_options vo ON vo.product_id = p.id
JOIN variant_option_values vov ON vov.option_id = vo.id
WHERE p.slug = 'candlescope-beanie';


-- ── 8. ERGEBNIS PRÜFEN ──────────────────────────────────────────────
SELECT
  p.category,
  p.name,
  p.price,
  p.badge,
  p.stock,
  COUNT(ps.id) AS skus
FROM products p
LEFT JOIN product_skus ps ON ps.product_id = p.id
GROUP BY p.id, p.category, p.name, p.price, p.badge, p.stock
ORDER BY p.category, p.price;
