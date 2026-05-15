import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import Modal from './Modal';

export type DialogVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  isOpen:        boolean;
  title:         string;
  description:   string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?:      DialogVariant;
  loading?:      boolean;
  onConfirm:     () => void;
  onCancel:      () => void;
}

const ICONS: Record<DialogVariant, React.ReactElement> = {
  danger:  <Trash2       size={20} strokeWidth={2} />,
  warning: <AlertTriangle size={20} strokeWidth={2} />,
  info:    <Info          size={20} strokeWidth={2} />,
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Bestätigen',
  cancelLabel  = 'Abbrechen',
  variant      = 'info',
  loading      = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm" hideClose>
      <div className={`confirm-dialog confirm-dialog--${variant}`}>
        <div className="confirm-dialog__icon">{ICONS[variant]}</div>
        <p className="confirm-dialog__desc">{description}</p>
        <div className="confirm-dialog__actions">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Wird ausgeführt…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
