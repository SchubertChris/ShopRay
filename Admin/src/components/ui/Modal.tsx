import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  title:     string;
  children:  ReactNode;
  size?:     'sm' | 'md';
  hideClose?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, size = 'sm', hideClose = false }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`modal modal--${size}`}>
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">{title}</h2>
          {!hideClose && (
            <button className="modal__close" onClick={onClose} aria-label="Schließen">
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
