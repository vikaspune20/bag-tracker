import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  name: string;
  options: string[];
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  ariaInvalid?: boolean;
  value?: string;
  onChange?: (next: string) => void;
  onSelect?: (selected: string) => void;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function AutocompleteInput({
  name,
  options,
  required,
  placeholder,
  autoComplete,
  className,
  ariaInvalid,
  value,
  onChange,
  onSelect,
}: Props) {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const blurTimeout = useRef<number | null>(null);

  const currentValue = isControlled ? value : inner;

  const filtered = useMemo(() => {
    const q = normalize(currentValue || '');
    if (!q) return options.slice(0, 50);
    return options
      .filter((o) => normalize(o).includes(q))
      .slice(0, 50);
  }, [currentValue, options]);

  useEffect(() => {
    if (!open) setActiveIndex(-1);
  }, [open]);

  const commit = (next: string) => {
    if (!isControlled) setInner(next);
    onChange?.(next);
    onSelect?.(next);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        value={currentValue}
        onChange={(e) => {
          const next = e.target.value;
          if (!isControlled) setInner(next);
          onChange?.(next);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (blurTimeout.current) window.clearTimeout(blurTimeout.current);
          blurTimeout.current = window.setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === 'Escape') {
            setOpen(false);
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
            return;
          }
          if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < filtered.length) {
            e.preventDefault();
            commit(filtered[activeIndex]);
          }
        }}
        aria-invalid={ariaInvalid}
        autoComplete={autoComplete}
        className={className}
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
          {filtered.map((opt, idx) => (
            <button
              key={`${name}-${opt}`}
              type="button"
              className={[
                'w-full text-left px-3 py-2 text-sm hover:bg-gray-50',
                idx === activeIndex ? 'bg-gray-50' : '',
              ].join(' ')}
              onMouseDown={(ev) => ev.preventDefault()}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => commit(opt)}
            >
              <div className="text-gray-900">{opt}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

