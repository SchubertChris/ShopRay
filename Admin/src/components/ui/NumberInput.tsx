import { useRef, type InputHTMLAttributes } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value:    number | string;
  onChange: (value: number) => void;
  step?:    number;
  min?:     number;
  max?:     number;
}

export default function NumberInput({ value, onChange, step = 1, min, max, className, ...rest }: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const increment = () => {
    const current = Number(value) || 0;
    const next    = max !== undefined ? Math.min(current + step, max) : current + step;
    onChange(next);
  };

  const decrement = () => {
    const current = Number(value) || 0;
    const next    = min !== undefined ? Math.max(current - step, min) : current - step;
    onChange(next);
  };

  return (
    <div className="input-number-wrap">
      <input
        {...rest}
        ref={inputRef}
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        className={`form-input ${className ?? ''}`}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
      <div className="input-number-wrap__arrows">
        <button type="button" onClick={increment} tabIndex={-1} aria-label="Erhöhen">
          <ChevronUp size={10} strokeWidth={2.5} />
        </button>
        <button type="button" onClick={decrement} tabIndex={-1} aria-label="Verringern">
          <ChevronDown size={10} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
