import { Loader2 } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { useProductForm } from './useProductForm';
import ProductFormHeader     from './components/ProductFormHeader';
import FormErrorBanner       from './components/FormErrorBanner';
import BasicDataSection      from './components/BasicDataSection';
import PricingStockSection   from './components/PricingStockSection';
import DealerDocumentsSection from './components/DealerDocumentsSection';
import LmivSection           from './components/LmivSection';
import SideColumn            from './components/SideColumn';

export default function ProductFormPage() {
  const vm = useProductForm();

  /* ── States ─────────────────────────────────────────────────────────────── */
  if (vm.loadingProduct) {
    return (
      <div className="page-loading">
        <Loader2 size={24} strokeWidth={1.5} className="spin" />
        <span>Produkt wird geladen…</span>
      </div>
    );
  }

  if (vm.loadError) {
    return (
      <div className="page-error">
        <p>{vm.loadError}</p>
        <button className="btn-secondary" onClick={() => vm.navigate(ROUTES.PRODUCTS.LIST)}>
          Zurück zur Liste
        </button>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      <ProductFormHeader
        isEdit={vm.isEdit}
        submitting={vm.submitting}
        onBack={() => vm.navigate(ROUTES.PRODUCTS.LIST)}
      />

      <FormErrorBanner error={vm.submitError} onClose={() => vm.setSubmitError(null)} />

      <form id="product-form" onSubmit={vm.handleSubmit} className="form-grid" noValidate>

        {/* ══ LINKE SPALTE ══════════════════════════════════════════════════ */}
        <div className="form-col">

          {/* ── Grunddaten ─────────────────────────────────────────────── */}
          <BasicDataSection
            form={vm.form}
            set={vm.set}
            handleNameChange={vm.handleNameChange}
            categories={vm.categories}
          />

          {/* ── Preis & Lager  |  USPs & Siegel ───────────────────────── */}
          <PricingStockSection form={vm.form} set={vm.set} setForm={vm.setForm} />

          {/* ── Händler & Bezugsquellen  |  Dokumente & Downloads ──────── */}
          <DealerDocumentsSection
            form={vm.form}
            addDealerLink={vm.addDealerLink}
            updateDealerLink={vm.updateDealerLink}
            removeDealerLink={vm.removeDealerLink}
            addDocument={vm.addDocument}
            updateDocument={vm.updateDocument}
            removeDocument={vm.removeDocument}
          />

          {/* ── LMIV ────────────────────────────────────────────────────── */}
          <LmivSection
            value={vm.form.lmiv}
            onChange={lmiv => vm.setForm(prev => ({ ...prev, lmiv }))}
          />

        </div>

        {/* ══ RECHTE SPALTE ═════════════════════════════════════════════════ */}
        <div className="form-col form-col--side">

          <SideColumn form={vm.form} setForm={vm.setForm} isEdit={vm.isEdit} id={vm.id} />

        </div>
      </form>
    </>
  );
}
