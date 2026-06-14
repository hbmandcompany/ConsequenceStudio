interface ToggleOption<T extends string> {
  id: T;
  label: string;
}

interface ToggleProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Toggle<T extends string>({ options, value, onChange, className = "" }: ToggleProps<T>) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-sm px-2 py-1 text-[10px] ${
            value === option.id
              ? "bg-cs-modal text-cs-primary border border-cs-active"
              : "text-cs-secondary border border-cs-hairline"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
