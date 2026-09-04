import { ChargeType } from './validation.constants';

interface ChargeTypeSwitcherProps {
  chargeType: ChargeType;
  onChange: (type: ChargeType) => void;
}

const OPTIONS: { value: ChargeType; label: string }[] = [
  { value: 'variable', label: 'Charges variables' },
  { value: 'fixe', label: 'Charges fixes' },
];

export function ChargeTypeSwitcher({ chargeType, onChange }: ChargeTypeSwitcherProps) {
  return (
    <div className="mb-6 flex gap-2">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
            chargeType === value
              ? 'bg-black text-white'
              : 'border border-separator bg-surface text-muted hover:bg-surface-secondary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
