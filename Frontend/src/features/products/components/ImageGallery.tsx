import { useState } from 'react';
import { getProductGallery } from '@config/images';

interface ImageGalleryProps {
  productId:   string | number;
  productName: string;
}

export function ImageGallery({ productId, productName }: ImageGalleryProps) {
  const images = getProductGallery(productId);
  const [active, setActive] = useState(0);

  return (
    <div className="product-gallery">
      <div className="product-gallery__main">
        <img
          key={active}
          src={images[active]}
          alt={`${productName} — Bild ${active + 1}`}
          className="product-gallery__img"
        />
      </div>

      {images.length > 1 && (
        <div className="product-gallery__thumbs">
          {images.map((src, i) => (
            <button
              key={i}
              className={`product-gallery__thumb${i === active ? ' is-active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Bild ${i + 1} anzeigen`}
              aria-pressed={i === active}
            >
              <img src={src} alt="" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
