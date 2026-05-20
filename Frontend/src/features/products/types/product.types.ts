/** Nährwert-Zeile für die LMIV-Tabelle */
export interface NutrientRow {
  name:        string;
  per100g:     string;
  perServing?: string;
  nrv?:        string;
}

/** LMIV-Pflichtangaben (EU-Lebensmittelinformationsverordnung 1169/2011) */
export interface LmivInfo {
  ingredients?:  string;
  allergens?:    string[];
  servingSize?:  string;
  netContent?:   string;
  nutrients?:    NutrientRow[];
  storageHint?:  string;
  usage?:        string;
  warnings?:     string[];
  manufacturer?: string;
}

/** Händler- oder Bezugsquellenlink auf der Produktdetailseite */
export interface DealerLink {
  label: string;
  href:  string;
  /** Optionales Logo — URL aus images.ts oder leer lassen für Text-Fallback */
  logo?: string;
}

/** Dokument-Download (Laboranalyse, Zertifikat, Anleitung etc.) */
export interface ProductDocument {
  label: string;
  href:  string;
  type:  'pdf' | 'external';
}

export interface VariantOptionValue {
  id:       string;
  value:    string;
  position: number;
}

export interface VariantOption {
  id:       string;
  name:     string;
  position: number;
  values:   VariantOptionValue[];
}

export interface ProductSku {
  id:          string;
  combination: Record<string, string>;
  stock:       number;
  priceOffset: number;
  skuCode:     string | null;
  active:      boolean;
}

/** Ein einzelnes Produkt im Shop */
export interface Product {
  id:          string;
  slug:        string;
  name:        string;
  price:       string;
  oldPrice:    string | null;
  badge:       string | null;
  discount:    string | null;
  rating:      number;
  reviews:     number;
  category:    string;
  /** Kurzbeschreibung — für Karten, Suche und Meta-Tags */
  description: string;
  stock?:      number;
  /** Produktbild-URL aus Supabase Storage (null = Platzhalter) */
  imageUrl:    string | null;
  /** Alle Produktbilder (erstes Bild = Hauptbild, max. 8) */
  images?:     string[];
  /** MwSt.-Satz in Prozent (z.B. 19, 7, 0) — pro Produkt konfigurierbar */
  taxRate:     number;
  lmiv?:       LmivInfo;

  // ── Detail-Felder (nur auf der Produktdetailseite genutzt) ────────────────
  /** Langer Fließtext mit HTML-Support für die Detailseite */
  richDescription?: string;
  /** USP-Stichpunkte — erscheinen direkt unter dem Preis */
  highlights?:      string[];
  /** Zertifikate & Siegel z. B. 'Bio', 'Vegan', 'Laborgeprüft' */
  certifications?:  string[];
  /** Händler- und Bezugsquellenlinks */
  dealerLinks?:     DealerLink[];
  /** Downloadbare Dokumente (PDFs, Zertifikate) */
  documents?:       ProductDocument[];

  // ── Varianten (nur auf Detailseite geladen) ────────────────────────────────
  variantOptions?: VariantOption[];
  skus?:           ProductSku[];
}

export type ProductCategory = 'Wohnen' | 'Deko' | 'Küche' | 'Textilien' | 'Kunst';

export type SortBy = 'popularity' | 'price-asc' | 'price-desc' | 'newest';
