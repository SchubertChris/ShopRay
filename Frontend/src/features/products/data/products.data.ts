import type { Product } from '../types/product.types';

export const PRODUCTS: Product[] = [
  // ── Produkt 1 — vollständige Detail-Daten als Vorlage ──────────────────────
  {
    id:       '1',
    slug:     'sage-candle-set',
    name:     'Sage Candle Set',
    price:    '24.00',
    oldPrice: '32.00',
    badge:    'Bestseller',
    discount: '-25%',
    rating:   4.8,
    reviews:  142,
    category: 'Wohnen',
    description: 'Handgegossene Kerzen aus 100 % Sojaöl mit ätherischen Ölen.',

    highlights: [
      '100 % natürliches Sojaöl',
      'Ätherische Öle — kein synthetisches Parfum',
      'Brenndauer ca. 48 Stunden',
      'Handgegossen in Berlin',
      'Plastikfreie Verpackung aus Recyclingkarton',
    ],

    richDescription: `
      <p>Das <strong>Sage Candle Set</strong> vereint drei handgegossene Duftkerzen, die nach uralten Rezepturen aus rein pflanzlichem Sojaöl gefertigt werden. Jede Kerze wird einzeln in unserer Berliner Manufaktur gegossen, von Hand beschriftet und sorgfältig in plastikfreie Recyclingkartons verpackt.</p>
      <p>Die Düfte sind aufeinander abgestimmt und entfalten in Kombination ein warmes, erdiges Raumgefühl — ideal für ruhige Abende, bewusstes Innehalten oder als Geschenk für Menschen, denen Qualität und Nachhaltigkeit wichtig sind.</p>
      <h4>Die drei Düfte im Set</h4>
      <ul>
        <li><strong>Sage &amp; Cedar</strong> — würzig, holzig, leicht herb</li>
        <li><strong>White Tea &amp; Mint</strong> — frisch, klar, belebend</li>
        <li><strong>Amber &amp; Sandalwood</strong> — warm, tief, sinnlich</li>
      </ul>
      <p>Der Docht besteht aus unbehandelter Baumwolle ohne Metallkern. Das Glas ist nach Gebrauch spülmaschinenfest und eignet sich hervorragend als Aufbewahrungsglas oder Blumentopf.</p>
    `,

    imageUrl: null,
    taxRate:  19,
    certifications: ['Vegan', 'Handmade', 'Plastikfrei', 'CO₂-neutral versandt'],

    lmiv: {
      ingredients:  'Soja-Wachs (100 %), ätherische Öle (Salvia officinalis, Cedrus atlantica, Camellia sinensis, Mentha piperita, Santalum album), Baumwolldocht',
      allergens:    ['Kann Spuren von Zitrus-Verbindungen enthalten'],
      netContent:   '3 × 180 g',
      storageHint:  'Kühl und trocken lagern, vor direktem Sonnenlicht schützen.',
      usage:        'Beim ersten Anzünden mindestens 2 Stunden brennen lassen, damit sich ein gleichmäßiger Schmelzpool bildet. Docht vor jedem Anzünden auf 5 mm kürzen.',
      warnings: [
        'Niemals unbeaufsichtigt brennen lassen.',
        'Von Kindern und Haustieren fernhalten.',
        'Auf feuerfester Unterlage verwenden.',
        'Nicht in Zugluft aufstellen.',
      ],
      manufacturer: 'ShopRay Manufaktur GmbH, Rosenthaler Str. 12, 10119 Berlin',
    },

    dealerLinks: [
      { label: 'Manufactum',   href: '#' },
      { label: 'Connox',       href: '#' },
      { label: 'WestwingNow', href: '#' },
    ],

    documents: [
      { label: 'Sicherheitsdatenblatt (PDF)', href: '#', type: 'pdf'      },
      { label: 'Zertifikat Sojaöl-Qualität',  href: '#', type: 'pdf'      },
      { label: 'Nachhaltigkeitsbericht',       href: '#', type: 'external' },
    ],
  },

  // ── Produkt 2 — vollständige Detail-Daten ─────────────────────────────────
  {
    id:       '2',
    slug:     'ceramic-vase-no-4',
    name:     'Ceramic Vase No. 4',
    price:    '45.00',
    oldPrice: null,
    badge:    'Neu',
    discount: null,
    rating:   4.9,
    reviews:  87,
    category: 'Deko',
    description: 'Handgedrehte Vase aus unglasiertem Steinzeug — jedes Stück ein Unikat.',

    highlights: [
      'Handgedreht auf der Töpferscheibe',
      'Unglasiertesc Steinzeug — jedes Stück einzigartig',
      'Wasserdicht durch Hochbrand bei 1.260 °C',
      'Made in Germany — Töpferei Schwarzwald',
      'Maße: ø 12 cm × H 28 cm',
    ],

    richDescription: `
      <p>Die <strong>Ceramic Vase No. 4</strong> ist das Herzstück unserer Keramikkollektion. Jede Vase wird einzeln auf der Töpferscheibe geformt, weshalb Form, Oberflächenstruktur und Farbton leicht variieren — kein Stück ist identisch.</p>
      <p>Das verwendete Steinzeug wird im Hochbrand bei 1.260 °C gebrannt, wodurch die Scherbe vollständig verglast und dauerhaft wasserdicht wird — trotz der unbehandelten, natürlich rauen Oberfläche außen.</p>
      <h4>Material &amp; Pflege</h4>
      <ul>
        <li>Steinzeug, unglasiert außen / innen glasiert</li>
        <li>Wasserdicht — für Schnittblumen geeignet</li>
        <li>Handwäsche empfohlen, kein Geschirrspüler</li>
        <li>Nicht mikrowellengeeignet</li>
      </ul>
      <p>Die natürliche Farbvariation zwischen Sandbeige und warmem Grauton ist kein Fehler, sondern das Merkmal echter Handarbeit. Kleine Einschlüsse oder Fingerabdrücke in der Tonmasse unterstreichen den handwerklichen Charakter.</p>
    `,

    imageUrl: null,
    taxRate:  19,
    certifications: ['Handmade', 'Made in Germany', 'Bleifreiglasiert'],

    dealerLinks: [
      { label: 'Manufactum', href: '#' },
      { label: 'Hay Shop',   href: '#' },
      { label: 'Flinders',   href: '#' },
    ],

    documents: [
      { label: 'Pflegehinweise (PDF)',   href: '#', type: 'pdf'      },
      { label: 'Materialzertifikat Ton', href: '#', type: 'pdf'      },
      { label: 'Töpferei auf Instagram', href: '#', type: 'external' },
    ],
  },

  // ── Produkt 3 — vollständige Detail-Daten ─────────────────────────────────
  {
    id:       '3',
    slug:     'stone-bowl-set',
    name:     'Stone Bowl Set',
    price:    '32.00',
    oldPrice: null,
    badge:    null,
    discount: null,
    rating:   4.6,
    reviews:  53,
    category: 'Küche',
    description: 'Drei ineinander gestapelte Schalen aus Naturstein.',

    highlights: [
      'Echtes Marmor — kein Kunststein',
      '3-teiliges Set (ø 10 / 14 / 18 cm)',
      'Handpoliert, lebensmittelecht versiegelt',
      'Spülmaschinenfest',
      'Ideal für Dips, Oliven, Snacks',
    ],

    richDescription: `
      <p>Das <strong>Stone Bowl Set</strong> besteht aus drei ineinander stapelbaren Schalen, die aus einem Block Carrara-Marmor gefräst und anschließend von Hand poliert werden. Die natürliche Maserung des Steins macht jedes Set zu einem Unikat.</p>
      <p>Die Schalen sind innen mit einer lebensmittelechten Versiegelung behandelt, die das Eindringen von Säuren (Zitrone, Essig) und Ölen verhindert, ohne die natürliche Oberfläche optisch zu verändern.</p>
      <h4>Lieferumfang &amp; Maße</h4>
      <ul>
        <li>Klein: ø 10 cm × H 4 cm — ideal für Dips &amp; Saucen</li>
        <li>Mittel: ø 14 cm × H 5 cm — für Oliven &amp; Nüsse</li>
        <li>Groß: ø 18 cm × H 6 cm — als Salatschale oder Centerpiece</li>
      </ul>
      <p>Marmor reagiert empfindlich auf Säuren — bei intensiver Nutzung mit sauren Lebensmitteln empfehlen wir, die Schalen nach Gebrauch mit einem milden Spülmittel zu reinigen und gründlich zu trocknen.</p>
    `,

    imageUrl: null,
    taxRate:  19,
    certifications: ['Naturmaterial', 'Lebensmittelecht versiegelt', 'Spülmaschinenfest'],

    lmiv: {
      ingredients:  'Carrara-Marmor (100 %), lebensmittelechte Mineralversiegelung (Siliciumdioxid)',
      storageHint:  'Trocken aufbewahren. Nicht mit stark säurehaltigen Lebensmitteln über längere Zeit in Kontakt lassen.',
      manufacturer: 'Artisan Stone SRL, Via del Marmo 7, 54033 Carrara (IT)',
    },

    dealerLinks: [
      { label: 'Connox',      href: '#' },
      { label: 'Zara Home',   href: '#' },
      { label: 'Kare Design', href: '#' },
    ],

    documents: [
      { label: 'Pflegehinweise Marmor (PDF)', href: '#', type: 'pdf' },
      { label: 'Versiegelungs-Zertifikat',    href: '#', type: 'pdf' },
    ],
  },

  // ── Produkte 4–8 — Basis-Daten (Detail-Content folgt je nach Bedarf) ──────
  { id:'4', slug:'studio-art-print',   name:'Studio Art Print',   price:'15.00', oldPrice:'22.00', badge:'Sale', discount:'-32%', rating:4.7, reviews:218, category:'Kunst',     description:'Archivfester Giclée-Druck auf 300 g Büttenkarton, 40 × 50 cm.',  imageUrl: null, taxRate: 19 },
  { id:'5', slug:'linen-throw',        name:'Linen Throw',        price:'68.00', oldPrice:null,    badge:null,   discount:null,   rating:4.9, reviews: 95, category:'Textilien', description:'Gewebte Überwurfdecke aus reinem belgischem Leinen.',             imageUrl: null, taxRate: 19 },
  { id:'6', slug:'bamboo-tray',        name:'Bamboo Tray',        price:'38.00', oldPrice:'48.00', badge:'Sale', discount:'-21%', rating:4.5, reviews: 67, category:'Küche',     description:'Servierplatte aus nachhaltigem Bambus mit Griffmulden.',          imageUrl: null, taxRate: 19 },
  { id:'7', slug:'scented-diffuser',   name:'Scented Diffuser',   price:'52.00', oldPrice:null,    badge:'Neu',  discount:null,   rating:4.8, reviews: 34, category:'Wohnen',    description:'Diffuser aus satiniertem Glas mit 8 Rattan-Stäben.',              imageUrl: null, taxRate: 19 },
  { id:'8', slug:'marble-coaster-set', name:'Marble Coaster Set', price:'28.00', oldPrice:null,    badge:null,   discount:null,   rating:4.7, reviews:108, category:'Wohnen',    description:'Vier handpolierte Untersetzer aus echtem Carrara-Marmor.',        imageUrl: null, taxRate: 19 },
];

export const CATEGORIES = ['Wohnen', 'Deko', 'Küche', 'Textilien', 'Kunst'] as const;
