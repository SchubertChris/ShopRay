import { LayoutList, LayoutGrid } from 'lucide-react';
import type { ViewMode } from '../../hooks/useViewMode';

interface Props {
  mode:     ViewMode;
  onToggle: () => void;
}

export default function ViewToggle({ mode, onToggle }: Props) {
  return (
    <button
      className={`view-toggle${mode === 'grid' ? ' is-active' : ''}`}
      onClick={onToggle}
      title={mode === 'table' ? 'Kachel-Ansicht' : 'Tabellen-Ansicht'}
    >
      {mode === 'table'
        ? <LayoutGrid size={15} strokeWidth={2} />
        : <LayoutList size={15} strokeWidth={2} />
      }
    </button>
  );
}
