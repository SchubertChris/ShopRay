import { createClient } from '@supabase/supabase-js';

const url        = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const products = [
  {
    name:        'Sage Candle Set',
    slug:        'sage-candle-set',
    description: 'Handgegossene Kerzen aus 100 % Sojaöl mit ätherischen Ölen.',
    price:       24.00,
    old_price:   32.00,
    badge:       'Bestseller',
    discount:    '-25%',
    category:    'Wohnen',
    rating:      4.8,
    reviews:     142,
    stock:       50,
    active:      true,
  },
  {
    name:        'Ceramic Vase No. 4',
    slug:        'ceramic-vase-no-4',
    description: 'Handgedrehte Vase aus unglasiertem Steinzeug — jedes Stück ein Unikat.',
    price:       45.00,
    old_price:   null,
    badge:       'Neu',
    discount:    null,
    category:    'Deko',
    rating:      4.9,
    reviews:     87,
    stock:       20,
    active:      true,
  },
  {
    name:        'Stone Bowl Set',
    slug:        'stone-bowl-set',
    description: 'Drei ineinander gestapelte Schalen aus Naturstein.',
    price:       32.00,
    old_price:   null,
    badge:       null,
    discount:    null,
    category:    'Küche',
    rating:      4.6,
    reviews:     53,
    stock:       35,
    active:      true,
  },
  {
    name:        'Studio Art Print',
    slug:        'studio-art-print',
    description: 'Archivfester Giclée-Druck auf 300 g Büttenkarton, 40 × 50 cm.',
    price:       15.00,
    old_price:   22.00,
    badge:       'Sale',
    discount:    '-32%',
    category:    'Kunst',
    rating:      4.7,
    reviews:     218,
    stock:       100,
    active:      true,
  },
  {
    name:        'Linen Throw',
    slug:        'linen-throw',
    description: 'Gewebte Überwurfdecke aus reinem belgischem Leinen.',
    price:       68.00,
    old_price:   null,
    badge:       null,
    discount:    null,
    category:    'Textilien',
    rating:      4.9,
    reviews:     95,
    stock:       25,
    active:      true,
  },
  {
    name:        'Bamboo Tray',
    slug:        'bamboo-tray',
    description: 'Servierplatte aus nachhaltigem Bambus mit Griffmulden.',
    price:       38.00,
    old_price:   48.00,
    badge:       'Sale',
    discount:    '-21%',
    category:    'Küche',
    rating:      4.5,
    reviews:     67,
    stock:       40,
    active:      true,
  },
  {
    name:        'Scented Diffuser',
    slug:        'scented-diffuser',
    description: 'Diffuser aus satiniertem Glas mit 8 Rattan-Stäben.',
    price:       52.00,
    old_price:   null,
    badge:       'Neu',
    discount:    null,
    category:    'Wohnen',
    rating:      4.8,
    reviews:     34,
    stock:       30,
    active:      true,
  },
  {
    name:        'Marble Coaster Set',
    slug:        'marble-coaster-set',
    description: 'Vier handpolierte Untersetzer aus echtem Carrara-Marmor.',
    price:       28.00,
    old_price:   null,
    badge:       null,
    discount:    null,
    category:    'Wohnen',
    rating:      4.7,
    reviews:     108,
    stock:       60,
    active:      true,
  },
];

async function seed() {
  console.log('Starte Seed...');

  const { data: existing } = await supabase.from('products').select('slug');
  const existingSlugs = new Set((existing ?? []).map((p: { slug: string }) => p.slug));

  const toInsert = products.filter(p => !existingSlugs.has(p.slug));

  if (toInsert.length === 0) {
    console.log('Alle Produkte bereits vorhanden — nichts zu tun.');
    return;
  }

  const { error } = await supabase.from('products').insert(toInsert);

  if (error) {
    console.error('Fehler beim Einfügen:', error.message);
    process.exit(1);
  }

  console.log(`✓ ${toInsert.length} Produkte erfolgreich angelegt.`);
}

seed();
