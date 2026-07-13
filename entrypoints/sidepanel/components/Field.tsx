interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
}

export function Field({ label, placeholder, value, onChange, mono }: FieldProps) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-muted-foreground">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-foreground ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}
