import { useRef, useState, useCallback } from 'react';
import { ImagePlus, X, Loader2, ZoomIn, Star, Link, Upload } from 'lucide-react';
import { uploadProductImage } from '../../api/adminApi';
import Modal from './Modal';

const MAX_IMAGES = 8;

type AddMode = 'upload' | 'url';

interface ImageGalleryEditorProps {
  images:   string[];
  onChange: (images: string[]) => void;
}

function isValidUrl(str: string): boolean {
  try { return Boolean(new URL(str)); } catch { return false; }
}

export default function ImageGalleryEditor({ images, onChange }: ImageGalleryEditorProps) {
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]         = useState(false);
  const [uploadError, setUploadError]     = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc]     = useState<string | null>(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [addMode, setAddMode]             = useState<AddMode>('upload');
  const [urlInput, setUrlInput]           = useState('');
  const [urlError, setUrlError]           = useState<string | null>(null);

  const addImages = useCallback(async (files: FileList) => {
    const remaining = MAX_IMAGES - images.length;
    const toUpload  = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    setUploadError(null);
    try {
      const urls = await Promise.all(toUpload.map(f => uploadProductImage(f)));
      onChange([...images, ...urls]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  }, [images, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addImages(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (addMode === 'upload' && e.dataTransfer.files?.length) addImages(e.dataTransfer.files);
  };

  const addByUrl = () => {
    const url = urlInput.trim();
    setUrlError(null);
    if (!url) return;
    if (!isValidUrl(url)) { setUrlError('Ungültige URL — bitte vollständige Adresse eingeben (https://…)'); return; }
    if (images.includes(url)) { setUrlError('Dieses Bild ist bereits in der Galerie.'); return; }
    if (images.length >= MAX_IMAGES) { setUrlError(`Maximal ${MAX_IMAGES} Bilder erlaubt.`); return; }
    onChange([...images, url]);
    setUrlInput('');
  };

  const removeImage = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  const setAsPrimary = (idx: number) => {
    if (idx === 0) return;
    const next = [...images];
    [next[0], next[idx]] = [next[idx], next[0]];
    onChange(next);
  };

  const canAdd = images.length < MAX_IMAGES && !uploading;

  return (
    <div className="img-gallery-editor">

      {/* Thumbnails */}
      <div className="img-gallery-editor__grid">
        {images.map((src, idx) => (
          <div key={src + idx} className={`img-gallery-editor__thumb${idx === 0 ? ' is-primary' : ''}`}>
            <img
              src={src}
              alt={`Produktbild ${idx + 1}`}
              onContextMenu={e => e.preventDefault()}
              onClick={() => setLightboxSrc(src)}
            />
            {idx === 0 && (
              <span className="img-gallery-editor__primary-badge">
                <Star size={9} strokeWidth={2.5} /> Haupt
              </span>
            )}
            <div className="img-gallery-editor__thumb-actions">
              <button type="button" className="img-gallery-editor__action" onClick={() => setLightboxSrc(src)} title="Vergrößern">
                <ZoomIn size={12} strokeWidth={2} />
              </button>
              {idx !== 0 && (
                <button type="button" className="img-gallery-editor__action" onClick={() => setAsPrimary(idx)} title="Als Hauptbild setzen">
                  <Star size={12} strokeWidth={2} />
                </button>
              )}
              <button type="button" className="img-gallery-editor__action img-gallery-editor__action--remove" onClick={() => removeImage(idx)} title="Entfernen">
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}

        {/* Upload-Drop-Zone (nur im Upload-Modus sichtbar) */}
        {canAdd && addMode === 'upload' && (
          <div
            className={`img-gallery-editor__add${isDragging ? ' is-dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            {uploading
              ? <Loader2 size={20} strokeWidth={1.5} className="spin" />
              : <ImagePlus size={20} strokeWidth={1.5} />
            }
            <span>{uploading ? 'Lädt hoch…' : 'Bild hinzufügen'}</span>
          </div>
        )}
      </div>

      {uploadError && <p className="form-error">{uploadError}</p>}

      <p className="form-hint">
        {images.length}/{MAX_IMAGES} Bilder · Erstes Bild = Hauptbild ·
        Klicken zum Zoom · Stern = Als Hauptbild setzen
      </p>

      {/* Modus-Tabs */}
      {canAdd && (
        <div className="img-gallery-editor__add-section">
          <div className="img-gallery-editor__mode-tabs">
            <button
              type="button"
              className={`img-gallery-editor__mode-tab${addMode === 'upload' ? ' is-active' : ''}`}
              onClick={() => { setAddMode('upload'); setUrlError(null); }}
            >
              <Upload size={13} strokeWidth={2} /> Datei hochladen
            </button>
            <button
              type="button"
              className={`img-gallery-editor__mode-tab${addMode === 'url' ? ' is-active' : ''}`}
              onClick={() => { setAddMode('url'); setUploadError(null); }}
            >
              <Link size={13} strokeWidth={2} /> Per Link importieren
            </button>
          </div>

          {addMode === 'url' && (
            <div className="img-gallery-editor__url-row">
              <input
                type="url"
                className="form-input"
                placeholder="https://beispiel.de/bild.jpg"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setUrlError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addByUrl(); } }}
              />
              <button type="button" className="btn-primary" onClick={addByUrl}>
                Hinzufügen
              </button>
            </div>
          )}

          {urlError && <p className="form-error">{urlError}</p>}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleFileChange}
      />

      <Modal isOpen={!!lightboxSrc} onClose={() => setLightboxSrc(null)} title="Bildvorschau" size="md">
        {lightboxSrc && (
          <div className="img-gallery-editor__lightbox">
            <img src={lightboxSrc} alt="Produktbild Vollansicht" onContextMenu={e => e.preventDefault()} />
          </div>
        )}
      </Modal>
    </div>
  );
}
