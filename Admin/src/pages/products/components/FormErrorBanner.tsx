import { X } from 'lucide-react';

interface FormErrorBannerProps {
  error:   string | null;
  onClose: () => void;
}

export default function FormErrorBanner({ error, onClose }: FormErrorBannerProps) {
  if (!error) return null;
  return (
    <div className="form-error-banner">
      <span>{error}</span>
      <button onClick={onClose} className="form-error-banner__close">
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
