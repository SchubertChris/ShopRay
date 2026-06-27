import LmivEditor from '../../../components/ui/LmivEditor';
import type { LmivInfo } from '../../../api/adminApi';

interface LmivSectionProps {
  value:    LmivInfo | null;
  onChange: (lmiv: LmivInfo | null) => void;
}

export default function LmivSection({ value, onChange }: LmivSectionProps) {
  return (
    <div className="form-section">
      <div className="form-section__head">
        <h2 className="form-section__title">Inhaltsstoffe & Nährwerte (LMIV)</h2>
        <p className="form-section__desc">
          Nur für Lebensmittel und Nahrungsergänzungsmittel. Erscheint im Tab
          "Inhaltsstoffe & Nährwerte" auf der Produktdetailseite.
        </p>
      </div>
      <LmivEditor
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
