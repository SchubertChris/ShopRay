import type { LmivInfo, DealerLink, ProductDocument } from '../../api/adminApi';
import type { ProductCategory } from '../../types/index';

/**
 * Interner Formular-State des Produkt-Formulars.
 * Numerische Felder werden hier als String gehalten (kontrollierte Inputs)
 * und erst beim Submit in Zahlen umgewandelt.
 */
export interface ProductFormData {
  name:             string;
  slug:             string;
  category:         ProductCategory;
  description:      string;
  price:            string;
  old_price:        string;
  discount:         string;
  badge:            string;
  stock:            string;
  active:           boolean;
  tax_rate:         number;
  images:           string[];
  rich_description: string;
  highlights:       string;   // eine pro Zeile
  certifications:   string;   // kommagetrennt
  lmiv:             LmivInfo | null;
  dealer_links:     DealerLink[];
  documents:        ProductDocument[];
  show_lmiv:        boolean;
  show_reviews:     boolean;
}
