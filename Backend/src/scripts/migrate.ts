import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url        = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function migrate() {
  console.log('Starte Migration…');

  // ── 1. Neue Spalten zur products-Tabelle hinzufügen ─────────────────────────
  const { error: colError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.products
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS tax_rate  DECIMAL(5,2) NOT NULL DEFAULT 19.00;
    `,
  });

  // Falls exec_sql nicht existiert, direkt über postgrest
  if (colError) {
    // Supabase erlaubt kein freies DDL über die REST-API —
    // Bitte folgenden SQL manuell im Supabase SQL-Editor ausführen:
    console.warn('\n⚠️  DDL kann nicht automatisch ausgeführt werden.');
    console.warn('Bitte folgenden SQL im Supabase SQL-Editor ausführen:\n');
    console.log('ALTER TABLE public.products');
    console.log("  ADD COLUMN IF NOT EXISTS image_url TEXT,");
    console.log("  ADD COLUMN IF NOT EXISTS tax_rate  DECIMAL(5,2) NOT NULL DEFAULT 19.00;\n");
    console.log('Dann: Storage → New Bucket → Name: product-images → Public: Ja\n');
  } else {
    console.log('✓ Spalten image_url und tax_rate hinzugefügt.');
  }

  // ── 2. GRANTs sicherstellen ──────────────────────────────────────────────────
  const { error: grantError } = await supabase.rpc('exec_sql', {
    sql: 'GRANT ALL ON public.products TO service_role;',
  });

  if (!grantError) {
    console.log('✓ GRANTs gesetzt.');
  }

  // ── 3. Admin-Passwort-Hash generieren ────────────────────────────────────────
  const bcrypt    = await import('bcrypt');
  const password  = process.env.ADMIN_PASSWORD ?? 'changeme';
  const hash      = await bcrypt.hash(password, 12);

  console.log('\n── .env Einträge ──────────────────────────────────────────────');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`JWT_SECRET=${Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`);
  console.log('\n→ Diese Werte in Backend/.env eintragen.\n');
  console.log('WICHTIG: ADMIN_PASSWORD aus der .env danach entfernen!\n');
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
