export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Segmented list filter control matching prototype `.seg`
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div className={`seg ${className}`}>
      {options.map((opt) => {
        const isOn = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            className={isOn ? 'on' : ''}
            onClick={() => onChange(opt.id)}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span className="num" style={{ opacity: 0.6, marginLeft: 4 }}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
