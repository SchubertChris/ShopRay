-- Merch — dunkle Kleidung, premium feel
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400&q=85&auto=format&fit=crop'
WHERE name = 'Merch';

-- Kurse — Laptop nachts, digitales Lernen
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1400&q=85&auto=format&fit=crop'
WHERE name = 'Kurse';

SELECT name, image_url IS NOT NULL AS hat_bild FROM categories;
