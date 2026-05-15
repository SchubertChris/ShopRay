-- ══════════════════════════════════════════════════════════════════════════════
-- ShopRay — Seed-Daten für Härtetest
-- Supabase SQL Editor → Alles markieren → Run
--
-- ACHTUNG: Löscht alle Kunden, Produkte, Tickets und Anfragen.
--          Dein eigener Admin-Account bleibt erhalten.
--          Alle Test-Kunden: Passwort = Test1234!
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. BEREINIGUNG ──────────────────────────────────────────────────────────
-- Reihenfolge: abhängige Tabellen zuerst

DELETE FROM public.reviews;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.tickets;
DELETE FROM public.contact_inquiries;
DELETE FROM public.products;

-- Nur Kunden löschen — dein eigener Account bleibt (role = 'admin' oder keine Übereinstimmung)
DELETE FROM auth.users
WHERE id IN (
  SELECT id FROM public.profiles WHERE role = 'customer'
);

-- ─── 2. TEST-KUNDEN (8 Stück, Passwort: Test1234!) ───────────────────────────

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
  ('a0000001-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'anna.mueller@shopray-test.de', crypt('Test1234!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"name":"Anna Müller"}',
   false, now() - interval '45 days', now(), '', '', '', ''),

  ('a0000002-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'thomas.schmidt@shopray-test.de', crypt('Test1234!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"name":"Thomas Schmidt"}',
   false, now() - interval '38 days', now(), '', '', '', ''),

  ('a0000003-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'sophie.weber@shopray-test.de', crypt('Test1234!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"name":"Sophie Weber"}',
   false, now() - interval '32 days', now(), '', '', '', ''),

  ('a0000004-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'leon.fischer@shopray-test.de', crypt('Test1234!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"name":"Leon Fischer"}',
   false, now() - interval '28 days', now(), '', '', '', ''),

  ('a0000005-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'emma.wagner@shopray-test.de', crypt('Test1234!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"name":"Emma Wagner"}',
   false, now() - interval '21 days', now(), '', '', '', ''),

  ('a0000006-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'lukas.becker@shopray-test.de', crypt('Test1234!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"name":"Lukas Becker"}',
   false, now() - interval '15 days', now(), '', '', '', ''),

  ('a0000007-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'mia.hoffmann@shopray-test.de', crypt('Test1234!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"name":"Mia Hoffmann"}',
   false, now() - interval '9 days', now(), '', '', '', ''),

  ('a0000008-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'felix.schneider@shopray-test.de', crypt('Test1234!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"name":"Felix Schneider"}',
   false, now() - interval '3 days', now(), '', '', '', '');

-- Profile aktualisieren (Trigger hat sie beim INSERT angelegt)
UPDATE public.profiles SET phone = '+49 30 12345678', address_street = 'Musterstraße 12',  address_zip = '10115', address_city = 'Berlin'    WHERE id = 'a0000001-0000-0000-0000-000000000001';
UPDATE public.profiles SET phone = '+49 89 87654321', address_street = 'Hauptstraße 45',   address_zip = '80331', address_city = 'München'   WHERE id = 'a0000002-0000-0000-0000-000000000002';
UPDATE public.profiles SET phone = '+49 40 11223344', address_street = 'Alsterweg 7',      address_zip = '20095', address_city = 'Hamburg'   WHERE id = 'a0000003-0000-0000-0000-000000000003';
UPDATE public.profiles SET phone = '+49 221 5566778', address_street = 'Domstraße 23',     address_zip = '50667', address_city = 'Köln'      WHERE id = 'a0000004-0000-0000-0000-000000000004';
UPDATE public.profiles SET phone = '+49 69 99887766', address_street = 'Goethestraße 3',   address_zip = '60313', address_city = 'Frankfurt' WHERE id = 'a0000005-0000-0000-0000-000000000005';
UPDATE public.profiles SET phone = '+49 711 4455667', address_street = 'Schillerstraße 19',address_zip = '70173', address_city = 'Stuttgart' WHERE id = 'a0000006-0000-0000-0000-000000000006';
UPDATE public.profiles SET phone = '+49 211 3344556', address_street = 'Königsallee 88',   address_zip = '40212', address_city = 'Düsseldorf'WHERE id = 'a0000007-0000-0000-0000-000000000007';
UPDATE public.profiles SET phone = '+49 341 2233445', address_street = 'Augustusplatz 4',  address_zip = '04109', address_city = 'Leipzig'   WHERE id = 'a0000008-0000-0000-0000-000000000008';

-- ─── 3. PRODUKTE (25 Stück, 5 Kategorien) ────────────────────────────────────

INSERT INTO public.products (
  name, slug, description, price, old_price, discount, badge,
  category, stock, active, image_url, images, tax_rate,
  rich_description, highlights, certifications, rating, reviews
) VALUES

-- ── WOHNEN ────────────────────────────────────────────────────────────────────
('Leinen-Kissenbezug Set (2er)',
 'leinen-kissenbezug-set-2er',
 'Zeitlose Kissenbezüge aus 100 % naturbelassenem Leinen. Weich, atmungsaktiv und mit jedem Waschen schöner.',
 39.90, NULL, NULL, 'Neu',
 'Wohnen', 42, TRUE,
 'https://picsum.photos/seed/sr-kissen/800/1000',
 '["https://picsum.photos/seed/sr-kissen/800/1000","https://picsum.photos/seed/sr-kissen2/800/1000","https://picsum.photos/seed/sr-kissen3/1000/800"]',
 19,
 '<p>Unsere Leinen-Kissenbezüge überzeugen durch ihre natürliche Textur und angenehme Haptik. Das Leinen stammt aus nachhaltigem Anbau in Europa und wird nach jedem Waschen weicher.</p>',
 '["100 % naturbelassenes Leinen","Maße: 40 × 60 cm (Standard)","Reißverschluss-Verschluss","Maschinenwaschbar bei 60 °C","Lieferung im 2er-Set"]',
 '["OEKO-TEX Standard 100","Europäische Produktion"]',
 4.5, 18),

('Bambus-Regal 3-stöckig',
 'bambus-regal-3-stoeckig',
 'Elegantes Standregal aus nachhaltigem Bambus — stabil, leicht und in jedem Raum ein Hingucker.',
 89.90, NULL, NULL, NULL,
 'Wohnen', 17, TRUE,
 'https://picsum.photos/seed/sr-regal/800/1000',
 '["https://picsum.photos/seed/sr-regal/800/1000","https://picsum.photos/seed/sr-regal2/800/1000"]',
 19,
 '<p>Drei großzügige Ablagen bieten Platz für Bücher, Pflanzen und Deko. Die wasserresistente Oberfläche macht das Regal auch für Bad oder Küche geeignet.</p>',
 '["Maße: 80 × 30 × 120 cm","Traglast je Ebene: 15 kg","Einfache Montage (< 20 Min.)","FSC-zertifizierter Bambus","Wasserresistente Oberfläche"]',
 '["FSC-zertifiziert"]',
 4.3, 11),

('Wandspiegel Rund Gold 60 cm',
 'wandspiegel-rund-gold-60cm',
 'Moderner runder Wandspiegel mit goldfarbenem Metallrahmen — ein echter Eyecatcher für jeden Raum.',
 129.90, 159.90, '-19%', NULL,
 'Wohnen', 8, TRUE,
 'https://picsum.photos/seed/sr-spiegel/800/1000',
 '["https://picsum.photos/seed/sr-spiegel/800/1000","https://picsum.photos/seed/sr-spiegel2/800/1000","https://picsum.photos/seed/sr-spiegel3/800/1000"]',
 19,
 '<p>Der goldene Metallrahmen setzt edle Akzente und harmoniert mit modernen wie klassischen Einrichtungsstilen. Inkl. Wandbefestigung montierfertig.</p>',
 '["Durchmesser: 60 cm","Rahmen: Messing vergoldet","Inkl. Wandbefestigung","Spiegeldicke: 5 mm","Gewicht: 2,8 kg"]',
 '[]',
 4.7, 24),

('Wanduhr Eiche minimalistisch',
 'wanduhr-eiche-minimalistisch',
 'Stille Quarz-Wanduhr aus massivem Eichenholz — lautloses Sweep-Uhrwerk, großes Design.',
 49.90, NULL, NULL, NULL,
 'Wohnen', 31, TRUE,
 'https://picsum.photos/seed/sr-uhr/800/1000',
 '["https://picsum.photos/seed/sr-uhr/800/1000","https://picsum.photos/seed/sr-uhr2/800/1000"]',
 19,
 '<p>Minimalistisches Design trifft auf hochwertige Materialien. Das lautlose Sweep-Uhrwerk sorgt auch nachts für absolute Stille.</p>',
 '["Durchmesser: 30 cm","Lautloses Sweep-Uhrwerk","Material: Massives Eichenholz","Batterie: 1 × AA (nicht inkl.)","Handgefertigt in Deutschland"]',
 '[]',
 4.6, 31),

('Couchtisch Walnuss massiv',
 'couchtisch-walnuss-massiv',
 'Massiver Couchtisch aus amerikanischer Walnuss — zeitlose Eleganz mit einzigartiger Maserung.',
 249.90, NULL, NULL, 'Premium',
 'Wohnen', 5, TRUE,
 'https://picsum.photos/seed/sr-tisch/800/1000',
 '["https://picsum.photos/seed/sr-tisch/800/1000","https://picsum.photos/seed/sr-tisch2/800/1000","https://picsum.photos/seed/sr-tisch3/1000/800","https://picsum.photos/seed/sr-tisch4/800/1000"]',
 19,
 '<p>Jeder Tisch ist ein Unikat — die natürliche Maserung der amerikanischen Walnuss macht jedes Stück unverwechselbar. Gefertigt in einer kleinen Tischlerei im Schwarzwald.</p>',
 '["Maße: 110 × 60 × 42 cm","Material: Amerik. Walnuss massiv","Geölte Oberfläche","Metallbeine schwarz pulverbeschichtet","Lieferung: 2–3 Wochen"]',
 '["Nachhaltige Forstwirtschaft","Handgefertigt in Deutschland"]',
 4.9, 7),

-- ── DEKO ──────────────────────────────────────────────────────────────────────
('Kerzenset Salbei & Lavendel (4er)',
 'kerzenset-salbei-lavendel-4er',
 'Handgegossene Sojakerzen mit natürlichen Düften — Salbei, Lavendel, Bergamotte und Vanille.',
 28.90, NULL, NULL, 'Bestseller',
 'Deko', 89, TRUE,
 'https://picsum.photos/seed/sr-kerzen/800/1000',
 '["https://picsum.photos/seed/sr-kerzen/800/1000","https://picsum.photos/seed/sr-kerzen2/800/1000"]',
 19,
 '<p>Vier harmonisch abgestimmte Düfte für jede Jahreszeit. Handgegossen in kleinen Chargen mit 100 % Sojawachs für gleichmäßige Qualität.</p>',
 '["100 % Sojawachs","Brenndauer je 25–30 Std.","Natürliche Duftstoffe","Baumwolldochte","Wiederverwendbare Gläser"]',
 '["Vegan","Parabenfrei"]',
 4.8, 67),

('Vase Keramik Steingrau',
 'vase-keramik-steingrau',
 'Handgefertigte Keramikvase in sanftem Steingrau — für Trockenblumen, Schnittblumen oder als Skulptur.',
 44.90, NULL, NULL, NULL,
 'Deko', 23, TRUE,
 'https://picsum.photos/seed/sr-vase/800/1000',
 '["https://picsum.photos/seed/sr-vase/800/1000","https://picsum.photos/seed/sr-vase2/800/1000","https://picsum.photos/seed/sr-vase3/800/1000"]',
 19,
 '<p>Jede Vase entsteht auf der Töpferscheibe in unserem Hamburger Atelier — kein Stück ist wie das andere.</p>',
 '["Höhe: 22 cm","Handgetöpfert — jedes Stück einzigartig","Innen glasiert (wasserdicht)","Steinzeug, gebrannt bei 1260 °C","Für Schnitt- und Trockenblumen"]',
 '["Handmade in Germany"]',
 4.7, 14),

('Trockenblumen-Arrangement Boho',
 'trockenblumen-arrangement-boho',
 'Fertig gestaltetes Bouquet mit Pampasgras, Lagurus und Getreide — hält jahrelang ohne Pflege.',
 34.90, NULL, NULL, NULL,
 'Deko', 14, TRUE,
 'https://picsum.photos/seed/sr-blumen/800/1000',
 '["https://picsum.photos/seed/sr-blumen/800/1000","https://picsum.photos/seed/sr-blumen2/800/1000"]',
 19,
 '<p>Kein Gießen, kein Verwelken — natürliche Trockenblumen die mehrere Jahre schön bleiben.</p>',
 '["Höhe: ca. 55 cm","Enthält: Pampasgras, Lagurus, Weizen","Fertig arrangiert — direkt einstellen","Hält mehrere Jahre"]',
 '[]',
 4.4, 21),

('Makramee Wandbehang Natur',
 'makramee-wandbehang-natur',
 'Handgeknüpfter Makramee-Wandbehang aus ungefärbter Baumwolle — Boho-Charme für jede Wand.',
 59.90, NULL, NULL, NULL,
 'Deko', 9, TRUE,
 'https://picsum.photos/seed/sr-makramee/800/1000',
 '["https://picsum.photos/seed/sr-makramee/800/1000","https://picsum.photos/seed/sr-makramee2/800/1000"]',
 19,
 '<p>Jedes Stück in Handarbeit geknüpft — kein Wandbehang ist identisch.</p>',
 '["Maße: ca. 60 × 90 cm","100 % ungefärbte Baumwolle","Inkl. Treibholz-Stab","Handgeknüpft — jedes Stück einzigartig"]',
 '["Naturmaterialien","Handmade"]',
 4.6, 9),

('Holzskulptur abstrakt Esche',
 'holzskulptur-abstrakt-esche',
 'Abstrakte Skulptur aus massiver Esche — limitierte Auflage, jedes Stück mit Echtheitszertifikat.',
 79.90, NULL, NULL, 'Limitiert',
 'Deko', 6, TRUE,
 'https://picsum.photos/seed/sr-skulptur/800/1000',
 '["https://picsum.photos/seed/sr-skulptur/800/1000","https://picsum.photos/seed/sr-skulptur2/800/1000"]',
 19,
 '<p>Handgeschnitzt von einem lokalen Künstler — limitierte Auflage von 20 Stück weltweit.</p>',
 '["Höhe: ca. 28 cm","Material: Massivholz Esche","Geölt, ohne Lackierung","Limitiert: 20 Stück","Inkl. nummeriertem Echtheitszertifikat"]',
 '["Limitierte Edition","Handmade"]',
 5.0, 3),

-- ── KÜCHE ─────────────────────────────────────────────────────────────────────
('Gusseisen-Cocotte 4 L Midnacht',
 'gusseisen-cocotte-4l-midnacht',
 'Emaillierter Gusseisentopf für perfekte Schmorgerichte — gleichmäßige Hitze, lebenslange Qualität.',
 189.90, 229.90, '-17%', NULL,
 'Küche', 12, TRUE,
 'https://picsum.photos/seed/sr-cocotte/800/1000',
 '["https://picsum.photos/seed/sr-cocotte/800/1000","https://picsum.photos/seed/sr-cocotte2/800/1000","https://picsum.photos/seed/sr-cocotte3/1000/800"]',
 19,
 '<p>In Midnacht-Blau mit weißer Innenemaillierung — der klassische Gusseisentopf in modernstem Look. Für alle Herdarten inkl. Induktion.</p>',
 '["Füllmenge: 4 Liter","Alle Herdarten inkl. Induktion","Ofenfest bis 260 °C","Innen weiß emailliert — leicht zu reinigen","Lebenslange Qualitätsgarantie"]',
 '["Lebenslange Garantie"]',
 4.8, 42),

('Schneidebrett Akazienholz',
 'schneidebrett-akazienholz',
 'Großzügiges Schneidebrett aus massivem Akazienholz mit Griff — ideal auch zum Servieren.',
 34.90, NULL, NULL, NULL,
 'Küche', 38, TRUE,
 'https://picsum.photos/seed/sr-brett/800/1000',
 '["https://picsum.photos/seed/sr-brett/800/1000","https://picsum.photos/seed/sr-brett2/1000/800"]',
 19,
 '<p>Akazienholz ist natürlich antibakteriell und besonders hart — ideal für den täglichen Einsatz.</p>',
 '["Maße: 45 × 30 × 2 cm","Material: Massiv-Akazienholz","Saftrille rundum","Pflegetipp: Gelegentlich ölen","Nicht spülmaschinengeeignet"]',
 '[]',
 4.4, 28),

('Keramik Frühstücks-Set (4er)',
 'keramik-fruehstuecks-set-4er',
 'Handgefertigtes Set mit 4 Tellern und 4 Bechern in harmonischen Erdtönen.',
 67.90, NULL, NULL, NULL,
 'Küche', 19, TRUE,
 'https://picsum.photos/seed/sr-keramik/800/1000',
 '["https://picsum.photos/seed/sr-keramik/800/1000","https://picsum.photos/seed/sr-keramik2/800/1000","https://picsum.photos/seed/sr-keramik3/1000/800"]',
 19,
 '<p>Handgetöpfert in Portugal — jedes Teil ein Unikat. Die Erdtöne harmonieren, auch wenn kein Stück identisch ist.</p>',
 '["4 × Teller Ø 21 cm + 4 × Becher 280 ml","Handgetöpfert","Spülmaschinengeeignet","Mikrowellengeeignet","Kleine Abweichungen = Unikat-Merkmal"]',
 '["Handmade in Portugal"]',
 4.6, 19),

('Messerblock Buchenholz 5-teilig',
 'messerblock-buchenholz-5-teilig',
 'Hochwertiges Messerset mit Buchenholzblock — alle Klingen aus rostfreiem Stahl 1.4116.',
 149.90, NULL, NULL, NULL,
 'Küche', 7, TRUE,
 'https://picsum.photos/seed/sr-messer/800/1000',
 '["https://picsum.photos/seed/sr-messer/800/1000","https://picsum.photos/seed/sr-messer2/800/1000"]',
 19,
 '<p>Das komplette Set: Kochmesser, Santoku, Brotmesser, Schälmesser und Wetzstahl im eleganten Buchenholzblock.</p>',
 '["5 Klingen + Block","Stahl: X50CrMoV15","Ergonomischer Griff","Blockmaße: 12 × 10 × 22 cm","Spülmaschinengeeignet (Klingen)"]',
 '[]',
 4.3, 16),

('Bienenwachs-Tücher 3er-Set',
 'bienenwachs-tuecher-3er-set',
 'Nachhaltige Alternative zu Frischhaltefolie — wiederverwendbar, antibakteriell, kompostierbar.',
 19.90, NULL, NULL, 'Öko',
 'Küche', 56, TRUE,
 'https://picsum.photos/seed/sr-beeswax/800/1000',
 '["https://picsum.photos/seed/sr-beeswax/800/1000","https://picsum.photos/seed/sr-beeswax2/800/1000"]',
 19,
 '<p>Bienenwachs, Jojobaöl und Baumwollharz als natürliche Alternative — bis zu einem Jahr nutzbar.</p>',
 '["Größen: S / M / L (15, 25, 35 cm)","Bis zu 1 Jahr haltbar","Waschen mit kaltem Wasser","Kompostierbar","Keine Kunststoffe / BPA-frei"]',
 '["Vegan","Plastikfrei","Kompostierbar"]',
 4.7, 53),

-- ── TEXTILIEN ─────────────────────────────────────────────────────────────────
('Merino-Wolldecke Naturweiß 140 × 200',
 'merino-wolldecke-naturweiss',
 'Kuschelige Decke aus 100 % Merino-Wolle — weich, temperaturregulierend und natürlich schön.',
 119.90, NULL, NULL, NULL,
 'Textilien', 22, TRUE,
 'https://picsum.photos/seed/sr-decke/800/1000',
 '["https://picsum.photos/seed/sr-decke/800/1000","https://picsum.photos/seed/sr-decke2/800/1000"]',
 19,
 '<p>Merino-Wolle: weich wie Kaschmir, strapazierfähiger als jede andere Wolle. Reguliert Feuchtigkeit und Temperatur automatisch.</p>',
 '["Maße: 140 × 200 cm","100 % Merino-Wolle","650 g/m²","Temperaturregulierend","Handwäsche 30 °C"]',
 '["Mulesing-frei","ZQ Merino zertifiziert"]',
 4.8, 33),

('Leinen-Bettwäsche Set 135 × 200',
 'leinen-bettwasche-set',
 'Atmendes Leinen-Bettwäsche-Set — wird mit jeder Wäsche weicher und schöner.',
 89.90, NULL, NULL, NULL,
 'Textilien', 18, TRUE,
 'https://picsum.photos/seed/sr-bett/800/1000',
 '["https://picsum.photos/seed/sr-bett/800/1000","https://picsum.photos/seed/sr-bett2/800/1000","https://picsum.photos/seed/sr-bett3/1000/800"]',
 19,
 '<p>Leinen reguliert Feuchtigkeit optimal — kein synthetisches Schwitzen, ideal für heiße Sommer und kühle Nächte.</p>',
 '["Bettbezug 135 × 200 + Kissenbezug 80 × 80","100 % Europäisches Leinen","Knitteroptik ist charakteristisch","Maschinenwaschbar 40 °C","OEKO-TEX zertifiziert"]',
 '["OEKO-TEX Standard 100","Europäisches Leinen"]',
 4.5, 27),

('Bio-Handtuch Set (4er)',
 'bio-handtuch-set-4er',
 'Flauschige Handtücher aus kammgarnierter Bio-Baumwolle — extra saugstark und langlebig.',
 54.90, NULL, NULL, NULL,
 'Textilien', 44, TRUE,
 'https://picsum.photos/seed/sr-handtuch/800/1000',
 '["https://picsum.photos/seed/sr-handtuch/800/1000","https://picsum.photos/seed/sr-handtuch2/800/1000"]',
 19,
 '<p>2 Handtücher (50 × 100) + 2 Duschtücher (70 × 140) aus GOTS-zertifizierter Bio-Baumwolle.</p>',
 '["2 × Handtuch 50 × 100 cm","2 × Duschtuch 70 × 140 cm","500 g/m² Frottee","Maschinenwaschbar 60 °C","Farbe: Sandbeige"]',
 '["GOTS zertifiziert","Bio-Baumwolle"]',
 4.6, 38),

('Seiden-Kissenbezug Champagner',
 'seiden-kissenbezug-champagner',
 'Kissenbezug aus 100 % Maulbeerseide — haarschonend, hautfreundlich und unglaublich weich.',
 44.90, NULL, NULL, 'Premium',
 'Textilien', 26, TRUE,
 'https://picsum.photos/seed/sr-seide/800/1000',
 '["https://picsum.photos/seed/sr-seide/800/1000","https://picsum.photos/seed/sr-seide2/800/1000"]',
 19,
 '<p>19 Momme Maulbeerseide — die optimale Stärke für Kissenbezüge. Verhindert Frizz und Druckfalten im Gesicht.</p>',
 '["Maße: 40 × 60 cm","100 % Maulbeerseide 19 Momme","Verdeckter Reißverschluss","Handwäsche oder Schonwaschgang","Dermatologisch getestet"]',
 '["Dermatologisch getestet","100 % Naturseide"]',
 4.7, 41),

('Gewichtsdecke 7 kg Graphit',
 'gewichtsdecke-7kg-graphit',
 'Therapeutische Gewichtsdecke für besseren Schlaf — sanfter Druck beruhigt das Nervensystem.',
 159.90, 179.90, '-11%', NULL,
 'Textilien', 11, TRUE,
 'https://picsum.photos/seed/sr-gewicht/800/1000',
 '["https://picsum.photos/seed/sr-gewicht/800/1000","https://picsum.photos/seed/sr-gewicht2/800/1000"]',
 19,
 '<p>7 kg Glasperlen-Füllung gleichmäßig auf 400 kleine Kammern verteilt — für konstanten Druck ohne Verschieben.</p>',
 '["Gewicht: 7 kg (für 60–90 kg Körpergewicht)","Füllung: Glasperlen","Abnehmbarer Jersey-Bezug, waschbar","Maße: 150 × 200 cm","Maschinenwaschbar 40 °C"]',
 '[]',
 4.4, 22),

-- ── KUNST ─────────────────────────────────────────────────────────────────────
('Art Print Golden Hour A2',
 'art-print-golden-hour-a2',
 'Limitierter Fine-Art-Print des Berliner Künstlers Jonas Kraft — goldenes Stundenlicht über den Alpen.',
 39.90, NULL, NULL, 'Limitiert',
 'Kunst', 30, TRUE,
 'https://picsum.photos/seed/sr-art1/800/1000',
 '["https://picsum.photos/seed/sr-art1/800/1000","https://picsum.photos/seed/sr-art1b/800/1000"]',
 19,
 '<p>Jonas Kraft fängt in seinen Landschaftsarbeiten das goldene Stundenlicht ein — hier in einer besonders gelungenen Alpenkomposition.</p>',
 '["Format: A2 (42 × 59,4 cm)","Fine Art Giclée auf 230 g Hahnemühle","Limitierte Auflage: 200 Stück","Signiert und nummeriert","Ohne Rahmen (passt in Standard-A2-Rahmen)"]',
 '["Limitierte Auflage","Handsigniert"]',
 4.9, 12),

('Holzdruck Weltkarte 60 × 40 cm',
 'holzdruck-weltkarte-60x40',
 'Detailreiche Weltkarte auf Birkensperrholz — die Holzstruktur schimmert durch und macht jeden Druck einzigartig.',
 54.90, NULL, NULL, NULL,
 'Kunst', 24, TRUE,
 'https://picsum.photos/seed/sr-welt/800/1000',
 '["https://picsum.photos/seed/sr-welt/800/1000","https://picsum.photos/seed/sr-welt2/1000/800"]',
 19,
 '<p>UV-Direktdruck auf 6 mm Birkensperrholz — kein Rahmen nötig, einfach aufhängen.</p>',
 '["Maße: 60 × 40 cm","Material: Birkensperrholz 6 mm","UV-Direktdruck, wasserfest","Inkl. 4 Aufhänger","Gewicht: 0,8 kg"]',
 '[]',
 4.5, 19),

('Aquarell Stadtansicht Hamburg',
 'aquarell-stadtansicht-hamburg',
 'Handgemaltes Aquarell der Hamburger Speicherstadt — jedes Bild ein echtes Original.',
 69.90, NULL, NULL, 'Original',
 'Kunst', 3, TRUE,
 'https://picsum.photos/seed/sr-aquarell/800/1000',
 '["https://picsum.photos/seed/sr-aquarell/800/1000","https://picsum.photos/seed/sr-aquarell2/800/1000"]',
 19,
 '<p>Handgemalt von der Hamburger Künstlerin Marie Reiter auf 300 g Baumwollpapier — kein Druck, echtes Original.</p>',
 '["Format: A4 (21 × 29,7 cm)","Aquarell, handgemalt","Fabriano 300 g/m² Baumwollpapier","Original — kein Druck","Inkl. Echtheitszertifikat und Signatur"]',
 '["Handgemalt Original","Signiert"]',
 5.0, 5),

('Fotodruck Schwarz-Weiß Paris',
 'fotodruck-sw-paris',
 'Klassischer SW-Fotodruck des Eiffelturms bei Sonnenaufgang — zeitlos, elegant, ikonisch.',
 29.90, NULL, NULL, NULL,
 'Kunst', 50, TRUE,
 'https://picsum.photos/seed/sr-paris/800/1000',
 '["https://picsum.photos/seed/sr-paris/800/1000","https://picsum.photos/seed/sr-paris2/800/1000"]',
 19,
 '<p>Aufgenommen bei Sonnenaufgang — fernab des Touristen-Trubels. Baryt-Fotopapier für Museumsqualität.</p>',
 '["Verfügbar: A4, A3, A2","Baryt-Fotopapier 315 g","Lieferung gerollt in Schutzrohr","Lichtecht 100+ Jahre","Kein Rahmen inkl."]',
 '[]',
 4.3, 34),

('Keramikschale Terrakotta Unikat',
 'keramikschale-terrakotta',
 'Handgetöpferte Schale in warmen Terrakotta-Tönen — für Obst, als Dekoschale oder für Snacks.',
 24.90, NULL, NULL, 'Unikat',
 'Kunst', 7, TRUE,
 'https://picsum.photos/seed/sr-schale/800/1000',
 '["https://picsum.photos/seed/sr-schale/800/1000","https://picsum.photos/seed/sr-schale2/800/1000"]',
 19,
 '<p>Jede Schale entsteht auf der Töpferscheibe — kein Stück ist wie das andere.</p>',
 '["Durchmesser: ca. 18–20 cm","Steinzeug, terrakottafarben","Lebensmittelecht glasiert","Spülmaschine nicht empfohlen","Absolutes Unikat"]',
 '["Handmade","Unikat"]',
 4.8, 8);

-- ─── 4. BESTELLUNGEN ──────────────────────────────────────────────────────────

INSERT INTO public.orders (user_id, order_number, status, total, shipping_address, paid_at, shipped_at, created_at) VALUES
('a0000001-0000-0000-0000-000000000001','SR-2025-00001','delivered', 169.80,
 '{"name":"Anna Müller","street":"Musterstraße 12","zip":"10115","city":"Berlin","country":"Deutschland"}'::jsonb,
 now()-interval'40 days', now()-interval'37 days', now()-interval'41 days'),

('a0000002-0000-0000-0000-000000000002','SR-2025-00002','delivered', 249.90,
 '{"name":"Thomas Schmidt","street":"Hauptstraße 45","zip":"80331","city":"München","country":"Deutschland"}'::jsonb,
 now()-interval'35 days', now()-interval'31 days', now()-interval'36 days'),

('a0000003-0000-0000-0000-000000000003','SR-2025-00003','shipped', 96.80,
 '{"name":"Sophie Weber","street":"Alsterweg 7","zip":"20095","city":"Hamburg","country":"Deutschland"}'::jsonb,
 now()-interval'12 days', now()-interval'9 days', now()-interval'13 days'),

('a0000004-0000-0000-0000-000000000004','SR-2025-00004','paid', 189.90,
 '{"name":"Leon Fischer","street":"Domstraße 23","zip":"50667","city":"Köln","country":"Deutschland"}'::jsonb,
 now()-interval'3 days', NULL, now()-interval'4 days'),

('a0000005-0000-0000-0000-000000000005','SR-2025-00005','cancelled', 54.90,
 '{"name":"Emma Wagner","street":"Goethestraße 3","zip":"60313","city":"Frankfurt","country":"Deutschland"}'::jsonb,
 NULL, NULL, now()-interval'18 days'),

('a0000006-0000-0000-0000-000000000006','SR-2025-00006','delivered', 129.80,
 '{"name":"Lukas Becker","street":"Schillerstraße 19","zip":"70173","city":"Stuttgart","country":"Deutschland"}'::jsonb,
 now()-interval'22 days', now()-interval'19 days', now()-interval'23 days'),

('a0000007-0000-0000-0000-000000000007','SR-2025-00007','paid', 119.90,
 '{"name":"Mia Hoffmann","street":"Königsallee 88","zip":"40212","city":"Düsseldorf","country":"Deutschland"}'::jsonb,
 now()-interval'5 days', NULL, now()-interval'6 days'),

('a0000008-0000-0000-0000-000000000008','SR-2025-00008','pending', 74.80,
 '{"name":"Felix Schneider","street":"Augustusplatz 4","zip":"04109","city":"Leipzig","country":"Deutschland"}'::jsonb,
 NULL, NULL, now()-interval'1 day'),

('a0000001-0000-0000-0000-000000000001','SR-2025-00009','shipped', 149.90,
 '{"name":"Anna Müller","street":"Musterstraße 12","zip":"10115","city":"Berlin","country":"Deutschland"}'::jsonb,
 now()-interval'8 days', now()-interval'5 days', now()-interval'9 days'),

('a0000002-0000-0000-0000-000000000002','SR-2025-00010','delivered', 54.80,
 '{"name":"Thomas Schmidt","street":"Hauptstraße 45","zip":"80331","city":"München","country":"Deutschland"}'::jsonb,
 now()-interval'29 days', now()-interval'26 days', now()-interval'30 days');

-- Order Items
INSERT INTO public.order_items (order_id, product_id, product_name, quantity, price) VALUES
-- SR-2025-00001: Spiegel + Bienenwachs×2
((SELECT id FROM public.orders WHERE order_number='SR-2025-00001'),
 (SELECT id FROM public.products WHERE slug='wandspiegel-rund-gold-60cm'),
 'Wandspiegel Rund Gold 60 cm', 1, 129.90),
((SELECT id FROM public.orders WHERE order_number='SR-2025-00001'),
 (SELECT id FROM public.products WHERE slug='bienenwachs-tuecher-3er-set'),
 'Bienenwachs-Tücher 3er-Set', 2, 19.90),

-- SR-2025-00002: Couchtisch
((SELECT id FROM public.orders WHERE order_number='SR-2025-00002'),
 (SELECT id FROM public.products WHERE slug='couchtisch-walnuss-massiv'),
 'Couchtisch Walnuss massiv', 1, 249.90),

-- SR-2025-00003: Kerzenset + Keramik-Set
((SELECT id FROM public.orders WHERE order_number='SR-2025-00003'),
 (SELECT id FROM public.products WHERE slug='kerzenset-salbei-lavendel-4er'),
 'Kerzenset Salbei & Lavendel (4er)', 1, 28.90),
((SELECT id FROM public.orders WHERE order_number='SR-2025-00003'),
 (SELECT id FROM public.products WHERE slug='keramik-fruehstuecks-set-4er'),
 'Keramik Frühstücks-Set (4er)', 1, 67.90),

-- SR-2025-00004: Cocotte
((SELECT id FROM public.orders WHERE order_number='SR-2025-00004'),
 (SELECT id FROM public.products WHERE slug='gusseisen-cocotte-4l-midnacht'),
 'Gusseisen-Cocotte 4 L Midnacht', 1, 189.90),

-- SR-2025-00005: Bio-Handtücher (storniert)
((SELECT id FROM public.orders WHERE order_number='SR-2025-00005'),
 (SELECT id FROM public.products WHERE slug='bio-handtuch-set-4er'),
 'Bio-Handtuch Set (4er)', 1, 54.90),

-- SR-2025-00006: Bettwäsche + Kissenbezug
((SELECT id FROM public.orders WHERE order_number='SR-2025-00006'),
 (SELECT id FROM public.products WHERE slug='leinen-bettwasche-set'),
 'Leinen-Bettwäsche Set 135 × 200', 1, 89.90),
((SELECT id FROM public.orders WHERE order_number='SR-2025-00006'),
 (SELECT id FROM public.products WHERE slug='leinen-kissenbezug-set-2er'),
 'Leinen-Kissenbezug Set (2er)', 1, 39.90),

-- SR-2025-00007: Merino-Decke
((SELECT id FROM public.orders WHERE order_number='SR-2025-00007'),
 (SELECT id FROM public.products WHERE slug='merino-wolldecke-naturweiss'),
 'Merino-Wolldecke Naturweiß 140 × 200', 1, 119.90),

-- SR-2025-00008: Vase + Keramikschale
((SELECT id FROM public.orders WHERE order_number='SR-2025-00008'),
 (SELECT id FROM public.products WHERE slug='vase-keramik-steingrau'),
 'Vase Keramik Steingrau', 1, 44.90),
((SELECT id FROM public.orders WHERE order_number='SR-2025-00008'),
 (SELECT id FROM public.products WHERE slug='keramikschale-terrakotta'),
 'Keramikschale Terrakotta Unikat', 1, 24.90),

-- SR-2025-00009: Messerblock
((SELECT id FROM public.orders WHERE order_number='SR-2025-00009'),
 (SELECT id FROM public.products WHERE slug='messerblock-buchenholz-5-teilig'),
 'Messerblock Buchenholz 5-teilig', 1, 149.90),

-- SR-2025-00010: Schneidebrett + Bienenwachs
((SELECT id FROM public.orders WHERE order_number='SR-2025-00010'),
 (SELECT id FROM public.products WHERE slug='schneidebrett-akazienholz'),
 'Schneidebrett Akazienholz', 1, 34.90),
((SELECT id FROM public.orders WHERE order_number='SR-2025-00010'),
 (SELECT id FROM public.products WHERE slug='bienenwachs-tuecher-3er-set'),
 'Bienenwachs-Tücher 3er-Set', 1, 19.90);

-- ─── 5. BEWERTUNGEN ───────────────────────────────────────────────────────────
-- Nur für Produkte die der jeweilige User auch bestellt hat (verified = true)

INSERT INTO public.reviews (product_id, user_id, rating, title, body, verified, created_at) VALUES

((SELECT id FROM public.products WHERE slug='wandspiegel-rund-gold-60cm'),
 'a0000001-0000-0000-0000-000000000001', 5,
 'Absolut begeistert!',
 'Der Spiegel ist noch schöner als auf den Fotos. Das Gold ist sehr edel und der Spiegel macht meinen Flur zu einem echten Hingucker. Sehr schnelle Lieferung.',
 true, now()-interval'38 days'),

((SELECT id FROM public.products WHERE slug='couchtisch-walnuss-massiv'),
 'a0000002-0000-0000-0000-000000000002', 5,
 'Traumhafter Tisch — jeden Cent wert',
 'Die Maserung ist einzigartig und die Verarbeitung ist tadellos. Der Tisch ist das Herzstück unseres Wohnzimmers geworden. Montage war einfach.',
 true, now()-interval'31 days'),

((SELECT id FROM public.products WHERE slug='kerzenset-salbei-lavendel-4er'),
 'a0000003-0000-0000-0000-000000000003', 4,
 'Toller Duft, schöne Verpackung',
 'Die Kerzen duften wunderbar und brennen sehr gleichmäßig. Die Gläser sind nach dem Abbrennen wiederverwendbar — super Idee!',
 true, now()-interval'10 days'),

((SELECT id FROM public.products WHERE slug='gusseisen-cocotte-4l-midnacht'),
 'a0000004-0000-0000-0000-000000000004', 5,
 'Beste Investition für die Küche',
 'Habe damit schon mehrfach Schmorgerichte gemacht — das Ergebnis ist jedes Mal perfekt. Schwer, aber das ist bei Gusseisen normal.',
 true, now()-interval'1 day'),

((SELECT id FROM public.products WHERE slug='leinen-bettwasche-set'),
 'a0000006-0000-0000-0000-000000000006', 5,
 'Endlich wieder gut schlafen',
 'Seitdem wir diese Bettwäsche haben, schwitze ich nachts nicht mehr. Die Knitteroptik sieht nach kurzer Zeit stylisch aus.',
 true, now()-interval'17 days'),

((SELECT id FROM public.products WHERE slug='merino-wolldecke-naturweiss'),
 'a0000007-0000-0000-0000-000000000007', 5,
 'Unfassbar weich',
 'Diese Decke ist das Beste was ich je für mein Sofa gekauft habe. Weich, warm ohne zu schwitzen. Absolut empfehlenswert.',
 true, now()-interval'3 days'),

((SELECT id FROM public.products WHERE slug='vase-keramik-steingrau'),
 'a0000008-0000-0000-0000-000000000008', 4,
 'Schönes Unikat',
 'Die Vase ist sehr schön und sieht genau so aus wie auf dem Foto. Kleine Unregelmäßigkeiten machen sie zum echten Unikat.',
 true, now()-interval'1 day'),

((SELECT id FROM public.products WHERE slug='kerzenset-salbei-lavendel-4er'),
 'a0000001-0000-0000-0000-000000000001', 5,
 'Verschenke diese Kerzen ständig',
 'Habe das Set schon 3 Mal bestellt — einmal für mich, zweimal als Geschenk. Jedes Mal begeisterte Reaktionen.',
 false, now()-interval'20 days'),

((SELECT id FROM public.products WHERE slug='bienenwachs-tuecher-3er-set'),
 'a0000002-0000-0000-0000-000000000002', 4,
 'Guter Ersatz für Plastikfolie',
 'Haften gut und halten wirklich lange. Man muss sich etwas umgewöhnen, aber nach einer Woche möchte man nicht mehr zurück.',
 true, now()-interval'27 days'),

((SELECT id FROM public.products WHERE slug='messerblock-buchenholz-5-teilig'),
 'a0000001-0000-0000-0000-000000000001', 5,
 'Scharf, schön und praktisch',
 'Die Messer sind von Anfang an sehr scharf und der Block sieht auf der Arbeitsplatte fantastisch aus. Top Qualität.',
 true, now()-interval'3 days');

-- ─── 6. SUPPORT-TICKETS ───────────────────────────────────────────────────────

INSERT INTO public.tickets (user_id, subject, message, category, status, reply, replied_at, created_at) VALUES

('a0000001-0000-0000-0000-000000000001',
 'Bestellung SR-2025-00001 — Wann kommt mein Paket?',
 'Hallo, ich habe vor 3 Tagen bestellt und noch keine Versandbestätigung bekommen. Können Sie mir helfen?',
 'order', 'closed',
 'Hallo Anna, vielen Dank für Ihre Anfrage. Ihre Bestellung wurde heute versendet, Sie erhalten die Tracking-Nummer per E-Mail. Freundliche Grüße, Ihr ShopRay Team',
 now()-interval'39 days', now()-interval'40 days'),

('a0000003-0000-0000-0000-000000000003',
 'Frage zur Pflege der Keramik-Vasen',
 'Guten Tag, ich habe die Keramikvase erhalten — sie ist wunderschön! Darf ich sie in die Spülmaschine tun oder lieber handwaschen?',
 'product', 'closed',
 'Hallo Sophie, wir empfehlen Handwäsche mit lauwarmem Wasser. Die Innenglasur ist zwar wasserdicht, aber Spülmaschinentabs können die matte Außenoberfläche angreifen. Viele Grüße!',
 now()-interval'10 days', now()-interval'11 days'),

('a0000004-0000-0000-0000-000000000004',
 'Zahlungsfehler bei Bestellung',
 'Ich wollte eine Bestellung aufgeben, aber die Zahlung wurde abgelehnt obwohl mein Konto gedeckt ist. Was soll ich tun?',
 'payment', 'in_progress',
 NULL, NULL, now()-interval'2 days'),

('a0000002-0000-0000-0000-000000000002',
 'Rückgabe — Couchtisch passt nicht',
 'Leider ist der Couchtisch zu groß für unser Zimmer (hätte ich besser messen sollen). Wie läuft eine Rückgabe ab? Der Tisch ist unbenutzt.',
 'order', 'open',
 NULL, NULL, now()-interval'28 days'),

('a0000006-0000-0000-0000-000000000006',
 'Produkt falsch geliefert',
 'Ich habe ein Leinen-Bettbezug 135×200 bestellt, bekommen habe ich aber 155×220. Bitte um schnelle Lösung.',
 'order', 'in_progress',
 NULL, NULL, now()-interval'5 days'),

('a0000007-0000-0000-0000-000000000007',
 'Rabattcode funktioniert nicht',
 'Ich habe einen Rabattcode von einem Freund erhalten (FREUND10), aber er wird beim Checkout nicht akzeptiert.',
 'other', 'open',
 NULL, NULL, now()-interval'1 day');

-- ─── 7. KONTAKTANFRAGEN ───────────────────────────────────────────────────────

INSERT INTO public.contact_inquiries (name, email, subject, message, consent, status, created_at) VALUES

('Maria Bergmann', 'maria.bergmann@gmail.com',
 'Frage zu Großbestellungen',
 'Hallo, ich bin Inneneinrichterin und würde gerne mehrere Produkte für ein Projekt bestellen. Gibt es Mengenrabatte ab 10 Einheiten?',
 true, 'replied', now()-interval'20 days'),

('Stefan Hoffmann', 'stefan.h@web.de',
 'Kooperationsanfrage',
 'Guten Tag, ich betreibe einen Interior-Design-Blog mit ca. 25.000 monatlichen Lesern und würde gerne über eine Kooperation sprechen.',
 true, 'read', now()-interval'14 days'),

('Julia Krause', 'j.krause@t-online.de',
 'Wo ist mein Paket?',
 'Ich habe vor 10 Tagen bestellt und noch nichts erhalten. Bestellnummer habe ich leider nicht mehr, aber E-Mail ist diese hier.',
 true, 'replied', now()-interval'8 days'),

('Andreas Meier', 'andreas.meier@outlook.com',
 'Produkt beschädigt angekommen',
 'Der Wandspiegel ist mit einem kleinen Riss im Rahmen angekommen. Habe Fotos gemacht. Bitte kontaktieren Sie mich.',
 true, 'read', now()-interval'5 days'),

('Sarah Klein', 'sarah.klein@gmx.de',
 'Geschenkverpackung möglich?',
 'Ich möchte ein Geburtstagsgeschenk bestellen. Bieten Sie Geschenkverpackung an? Und kann ich eine persönliche Karte beilegen?',
 true, 'new', now()-interval'3 days'),

('Markus Schulz', 'markus.schulz@icloud.com',
 'Allgemeine Anfrage zum Shop',
 'Sehr schöner Shop! Ich hätte gerne gewusst ob Sie auch in die Schweiz liefern und was die Versandkosten dafür sind.',
 true, 'new', now()-interval'2 days'),

('Laura Zimmermann', 'l.zimm@yahoo.de',
 'Reklamation Bienenwachs-Tücher',
 'Die Bienenwachstücher haben nach 2 Wochen bereits angefangen sich aufzulösen. Das habe ich so nicht erwartet. Bitte um Rückmeldung.',
 true, 'new', now()-interval'1 day'),

('Tom Richter', 'tom.richter@posteo.de',
 'Nachhaltigkeitsfrage',
 'Ich bin sehr an nachhaltigen Produkten interessiert. Können Sie mir mehr über Ihre Lieferanten und Nachhaltigkeitszertifizierungen erzählen?',
 true, 'new', now()-interval '6 hours');

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════════
-- FERTIG — Überblick:
--   Kunden    : 8 (anna.mueller, thomas.schmidt, sophie.weber, leon.fischer,
--                   emma.wagner, lukas.becker, mia.hoffmann, felix.schneider)
--   Passwort  : Test1234!  (alle gleich)
--   Produkte  : 25 (Wohnen×5, Deko×5, Küche×5, Textilien×5, Kunst×5)
--   Bestellungen: 10 (delivered, shipped, paid, pending, cancelled)
--   Bewertungen : 10
--   Tickets   : 6 (open, in_progress, closed)
--   Anfragen  : 8 (new, read, replied)
-- ══════════════════════════════════════════════════════════════════════════════
