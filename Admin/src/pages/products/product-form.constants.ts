import type { ProductFormData } from './product-form.types';

export const TAX_RATES = [
  { label: '0 % (steuerfrei)',       value: 0  },
  { label: '7 % (ermäßigt)',         value: 7  },
  { label: '19 % (Regelsteuersatz)', value: 19 },
];

export const EMPTY: ProductFormData = {
  name: '', slug: '', category: 'Merch', description: '',
  price: '', old_price: '', discount: '', badge: '',
  stock: '0', active: true, tax_rate: 19, images: [],
  rich_description: '', highlights: '', certifications: '',
  lmiv: null, dealer_links: [], documents: [],
  show_lmiv: true, show_reviews: true,
};

export function autoSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
