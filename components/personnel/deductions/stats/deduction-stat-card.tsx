import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: number;
  description: string;
  color?: 'red' | 'green' | 'orange' | 'default';
};

const amountColorClass: Record<NonNullable<Props['color']>, string> = {
  red: 'text-red-600',
  green: 'text-green-600',
  orange: 'text-orange-500',
  default: 'text-foreground',
};

function DeductionStatCard({ label, value, description, color = 'default' }: Props) {
  return (
    <Card>
      <CardHeader className="text-[#737373] pb-3">{label}</CardHeader>
      <CardContent className="flex flex-col">
        <span className={cn('text-xl mb-1', amountColorClass[color])}>{formatCFA(value)}</span>
        <span className="text-[#737373]">{description}</span>
      </CardContent>
    </Card>
  );
}

export default DeductionStatCard;
