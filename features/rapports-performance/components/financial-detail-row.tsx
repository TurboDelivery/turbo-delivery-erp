import { cn } from '@/lib/utils';

interface FinancialDetailRowProps {
  label: string;
  value: string;
  rowClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  withBorder?: boolean;
}

export function FinancialDetailRow({
  label,
  value,
  rowClassName = '',
  labelClassName = 'text-muted',
  valueClassName = 'font-semibold text-foreground',
  withBorder = false,
}: FinancialDetailRowProps) {
  const borderClassName = withBorder ? 'border-b border-separator' : '';

  return (
    <div className={`flex items-center text-medium justify-between py-3 ${borderClassName} ${rowClassName}`.trim()}>
      <span className={labelClassName}>{label}</span>
      <span className={cn('text-lg',valueClassName)}>{value}</span>
    </div>
  );
}

