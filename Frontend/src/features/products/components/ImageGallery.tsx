import { useState } from 'react';
import { getProductGallery } from '@config/images';

interface ImageGalleryProps {
  productId:   string | number;
  productName: string;
  /** Bilder aus der DB (erstes = Hauptbild). Fehlen sie, greift der Config-Fallback. */
  images?:     string[];
}

export function ImageGallery({ productId, productName, images }: ImageGalleryProps) {
  const gallery = (images && images.length > 0) ? images : getProductGallery(productId);
  const [active, setActive] = useState(0);

  return (
    <div className="product-gallery">
      <div className="product-gallery__main">
        <img
          key={active}
          src={gallery[active]}
          alt={`${productName} — Bild ${active + 1}`}
          className="product-gallery__img"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      {gallery.length > 1 && (
        <div className="product-gallery__thumbs">
          {gallery.map((src, i) => (
            <button
              key={i}
              className={`product-gallery__thumb${i === active ? ' is-active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Bild ${i + 1} anzeigen`}
              aria-pressed={i === active}
            >
              <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
