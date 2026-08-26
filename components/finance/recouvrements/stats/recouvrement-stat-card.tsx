'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMontant } from '@/utils/format.utils';
import Link from 'next/link';
import { ReactNode } from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  colorVariant?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo';
  href?: string;
  formatValue?: (value: string | number) => string;
  className?: string;
}

const colorVariants = {
  blue: 'border-l-4 border-l-blue-500 bg-blue-50/50 text-blue-600',
  green: 'border-l-4 border-l-green-500 bg-green-50/50 text-green-600',
  amber: 'border-l-4 border-l-amber-500 bg-amber-50/50 text-amber-600',
  red: 'border-l-4 border-l-red-500 bg-red-50/50 text-red-600',
  purple: 'border-l-4 border-l-purple-500 bg-purple-50/50 text-purple-600',
  indigo: 'border-l-4 border-l-indigo-500 bg-indigo-50/50 text-indigo-600',
};

export function StatCard({
  title,
  value,
  icon,
  colorVariant = 'blue',
  href,
  formatValue,
  className = '',
}: StatCardProps) {
  const formattedValue = formatValue ? formatValue(value) : value;
  const colorClasses = colorVariants[colorVariant];

  const cardContent = (
    <>
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
          <div className={colorClasses.split(' ').slice(-1)[0]}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 px-5">
        <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{formattedValue}</p>
      </CardContent>
    </>
  );

  const cardClassName = `rounded-lg p-0 overflow-hidden ${colorClasses} ${className}`;

  if (href) {
    return (
      <Card className={cardClassName}>
        <Link href={href}>{cardContent}</Link>
      </Card>
    );
  }

  return <Card className={cardClassName}>{cardContent}</Card>;
}

// Helper function pour formater en devise
export const formatCurrency = (value: string | number, currency: string = 'XOF'): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  // `style: 'currency'` avec XOF rend « F CFA » ; l'ERP écrit « FCFA ».
  return formatMontant(numValue);
};

// Helper function pour formater en nombre
export const formatNumber = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue.toLocaleString('fr-FR');
};

// Helper function pour formater en pourcentage
export const formatPercentage = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `${numValue.toFixed(1)}%`;
};
