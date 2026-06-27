import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@config/routes';
import { getAdminProduct, createProduct, updateProduct, getCategories } from '../../api/adminApi';
import type { AdminProduct, DealerLink, ProductDocument, Category } from '../../api/adminApi';
import type { ProductCategory } from '../../types/index';
import type { ProductFormData } from './product-form.types';
import { EMPTY, autoSlug } from './product-form.constants';

export function useProductForm() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form, setForm]                   = useState<ProductFormData>(EMPTY);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [loadError, setLoadError]         = useState<string | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [categories, setCategories]       = useState<Category[]>([]);

  /* ── Kategorien laden ───────────────────────────────────────────────────── */
  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  /* ── Produkt laden (Edit-Modus) ─────────────────────────────────────────── */
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingProduct(true);
    getAdminProduct(id)
      .then((p: AdminProduct) => {
        setForm({
          name:             p.name,
          slug:             p.slug,
          category:         p.category as ProductCategory,
          description:      p.description,
          price:            String(p.price),
          old_price:        p.old_price != null ? String(p.old_price) : '',
          discount:         p.discount ?? '',
          badge:            p.badge ?? '',
          stock:            String(p.stock),
          active:           p.active,
          tax_rate:         p.tax_rate,
          images:           Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
          rich_description: p.rich_description ?? '',
          highlights:       (p.highlights ?? []).join('\n'),
          certifications:   (p.certifications ?? []).join(', '),
          lmiv:             p.lmiv ?? null,
          dealer_links:     p.dealer_links ?? [],
          documents:        p.documents ?? [],
          show_lmiv:        p.sections_config?.lmiv    !== false,
          show_reviews:     p.sections_config?.reviews  !== false,
        });
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Produkt konnte nicht geladen werden'))
      .finally(() => setLoadingProduct(false));
  }, [id, isEdit]);

  /* ── Helfer ─────────────────────────────────────────────────────────────── */
  const set = (field: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(prev => ({ ...prev, name, slug: autoSlug(name) }));
  }, []);

  /* ── Dealer Links ───────────────────────────────────────────────────────── */
  const addDealerLink = () =>
    setForm(prev => ({ ...prev, dealer_links: [...prev.dealer_links, { label: '', href: '' }] }));

  const updateDealerLink = (i: number, field: keyof DealerLink, val: string) =>
    setForm(prev => {
      const rows = [...prev.dealer_links];
      rows[i] = { ...rows[i], [field]: val };
      return { ...prev, dealer_links: rows };
    });

  const removeDealerLink = (i: number) =>
    setForm(prev => ({ ...prev, dealer_links: prev.dealer_links.filter((_, idx) => idx !== i) }));

  /* ── Dokumente ──────────────────────────────────────────────────────────── */
  const addDocument = () =>
    setForm(prev => ({ ...prev, documents: [...prev.documents, { label: '', href: '', type: 'pdf' as const }] }));

  const updateDocument = (i: number, field: keyof ProductDocument, val: string) =>
    setForm(prev => {
      const rows = [...prev.documents];
      rows[i] = { ...rows[i], [field]: val } as ProductDocument;
      return { ...prev, documents: rows };
    });

  const removeDocument = (i: number) =>
    setForm(prev => ({ ...prev, documents: prev.documents.filter((_, idx) => idx !== i) }));

  /* ── Validation ─────────────────────────────────────────────────────────── */
  const validate = (): string | null => {
    if (!form.name.trim())        return 'Produktname ist Pflichtfeld';
    if (!form.slug.trim())        return 'Slug ist Pflichtfeld';
    if (!form.description.trim()) return 'Beschreibung ist Pflichtfeld';
    if (!form.category)           return 'Kategorie ist Pflichtfeld';
    const priceNum = parseFloat(form.price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) return 'Preis muss größer als 0 sein';
    return null;
  };

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const validationError = validate();
    if (validationError) { setSubmitError(validationError); return; }
    setSubmitting(true);

    const priceNum    = parseFloat(form.price.replace(',', '.'));
    const oldPriceNum = form.old_price.trim() ? parseFloat(form.old_price.replace(',', '.')) : null;
    const imagesArr   = form.images.filter(Boolean);

    const payload = {
      name:             form.name.trim(),
      slug:             form.slug.trim(),
      description:      form.description.trim(),
      category:         form.category,
      price:            priceNum,
      old_price:        oldPriceNum,
      discount:         form.discount.trim()  || null,
      badge:            form.badge.trim()     || null,
      stock:            parseInt(form.stock, 10) || 0,
      active:           form.active,
      tax_rate:         form.tax_rate,
      image_url:        imagesArr[0] ?? null,
      images:           imagesArr,
      rich_description: form.rich_description.trim() || null,
      highlights:       form.highlights.split('\n').map(s => s.trim()).filter(Boolean),
      certifications:   form.certifications.split(',').map(s => s.trim()).filter(Boolean),
      lmiv:             form.lmiv,
      dealer_links:     form.dealer_links.filter(d => d.label.trim() && d.href.trim()),
      documents:        form.documents.filter(d => d.label.trim() && d.href.trim()),
      sections_config:  { lmiv: form.show_lmiv, reviews: form.show_reviews },
    };

    try {
      if (isEdit && id) await updateProduct(id, payload);
      else               await createProduct(payload);
      navigate(ROUTES.PRODUCTS.LIST);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
      setSubmitError(
        msg.includes('409') || msg.toLowerCase().includes('slug')
          ? 'Dieser Slug ist bereits vergeben. Bitte einen anderen wählen.'
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    id,
    isEdit,
    navigate,
    form,
    setForm,
    categories,
    loadingProduct,
    loadError,
    submitting,
    submitError,
    setSubmitError,
    set,
    handleNameChange,
    addDealerLink,
    updateDealerLink,
    removeDealerLink,
    addDocument,
    updateDocument,
    removeDocument,
    handleSubmit,
  };
}
