-- ═══════════════════════════════════════════════════════════════════
-- CANDLESCOPE — Produktbilder (Unsplash Platzhalter)
-- Ersetzen sobald echte Produktfotos vorhanden sind
-- ═══════════════════════════════════════════════════════════════════

-- Schlüsselanhänger — gold/accessories
UPDATE products SET
  image_url = 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=85&auto=format&fit=crop',
  images    = '["https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=85&auto=format&fit=crop","https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800&q=85&auto=format&fit=crop"]'::jsonb
WHERE slug = 'candlescope-schluesselanhaenger';

-- Shirt — clean white tee
UPDATE products SET
  image_url = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85&auto=format&fit=crop',
  images    = '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85&auto=format&fit=crop","https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=85&auto=format&fit=crop"]'::jsonb
WHERE slug = 'candlescope-shirt';

-- Pullover — premium hoodie
UPDATE products SET
  image_url = 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=85&auto=format&fit=crop',
  images    = '["https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=85&auto=format&fit=crop","https://images.unsplash.com/photo-1578681994506-b8f463449011?w=800&q=85&auto=format&fit=crop"]'::jsonb
WHERE slug = 'candlescope-pullover';

-- Sticker-Set — stickers flat lay
UPDATE products SET
  image_url = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=85&auto=format&fit=crop',
  images    = '["https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=85&auto=format&fit=crop"]'::jsonb
WHERE slug = 'candlescope-sticker-set';

-- Windows + Claude Code — coding setup
UPDATE products SET
  image_url = 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=85&auto=format&fit=crop',
  images    = '["https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=85&auto=format&fit=crop","https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&q=85&auto=format&fit=crop"]'::jsonb
WHERE slug = 'kurs-windows-claude-code';

-- Trading Kurs — charts/finance
UPDATE products SET
  image_url = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=85&auto=format&fit=crop',
  images    = '["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=85&auto=format&fit=crop","https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=85&auto=format&fit=crop"]'::jsonb
WHERE slug = 'kurs-trading-anfaenger';

-- Prompt Starter Kit — AI/digital
UPDATE products SET
  image_url = 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=85&auto=format&fit=crop',
  images    = '["https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=85&auto=format&fit=crop","https://images.unsplash.com/photo-1655720031554-a929595ffad7?w=800&q=85&auto=format&fit=crop"]'::jsonb
WHERE slug = 'prompt-starter-kit';

-- Trading Journal — notebook/journal
UPDATE products SET
  image_url = 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=85&auto=format&fit=crop',
  images    = '["https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=85&auto=format&fit=crop","https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=85&auto=format&fit=crop"]'::jsonb
WHERE slug = 'trading-journal-template';

-- Ergebnis prüfen
SELECT slug, image_url IS NOT NULL AS hat_bild, jsonb_array_length(images) AS bild_anzahl
FROM products ORDER BY category, price;
