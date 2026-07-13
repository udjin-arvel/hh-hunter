interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: [T, string][];
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: SegmentedProps<T>) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-muted-foreground">{label}</div>
      <div className="flex rounded-xl bg-surface p-1 text-[12px]">
        {options.map(([key, optionLabel]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex-1 rounded-lg py-1.5 transition ${
              value === key ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
