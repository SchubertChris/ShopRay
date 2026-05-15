import { getProductImage, toImageIndex } from '@config/images';
import type { Product } from '@features/products';

const VARIANT_COUNT = 8;

interface ProductImageProps {
  /** Vollständiges Produkt-Objekt — imageUrl aus DB wird bevorzugt */
  product?: Pick<Product, 'id' | 'imageUrl'>;
  /** Fallback: nur ID wenn kein Produkt-Objekt vorhanden */
  id?: string | number;
}

export function ProductImage({ product, id }: ProductImageProps) {
  const resolvedId  = product?.id ?? id ?? 0;
  const n           = toImageIndex(resolvedId);
  const v           = ((n - 1) % VARIANT_COUNT) + 1;
  const src         = product?.imageUrl ?? getProductImage(n);

  return (
    <div className={`product-image product-image--v${v}`}>
      {src ? (
        <>
          <img src={src} alt="" loading="lazy" onContextMenu={(e) => e.preventDefault()} />
          <div className="product-image__overlay" aria-hidden="true" />
        </>
      ) : (
        <div className="product-image__shape" />
      )}
    </div>
  );
}
