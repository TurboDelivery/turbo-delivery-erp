import React from 'react';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface CommissionBadgeProps {
  label: string;
  amount: number;
  widthClassName?: string;
}

export default function CommissionBadge({ label, amount, widthClassName = 'w-44' }: CommissionBadgeProps) {
  return (
    <div className="flex flex-col text-sm">
      <div className={`bg-red-500 text-white rounded-t-lg px-2 py-0.5 ${widthClassName} text-center`}>{label}</div>
      <div className="bg-red-200 text-red-700 text-center rounded-b-lg px-2 py-0.5">{formatCFA(amount)}</div>
    </div>
  );
}

