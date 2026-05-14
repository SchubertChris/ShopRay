import { getProductImage } from '@config/images';

const VARIANT_COUNT = 8;

interface ProductImageProps {
  id: number;
}

export function ProductImage({ id }: ProductImageProps) {
  const v   = ((id - 1) % VARIANT_COUNT) + 1;
  const url = getProductImage(id);

  return (
    <div className={`product-image product-image--v${v}`}>
      {url ? (
        <>
          <img src={url} alt="" loading="lazy" onContextMenu={(e) => e.preventDefault()} />
          {/* Farb-Overlay: passt das Bild farblich ans aktive Theme an */}
          <div className="product-image__overlay" aria-hidden="true" />
        </>
      ) : (
        <div className="product-image__shape" />
      )}
    </div>
  );
}
