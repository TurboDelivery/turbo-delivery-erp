import React from 'react';

type StatsCardProps = {
  title: string;
  value: string | number;
  variant?: 'primary' | 'default';
};

export function TicketStatsCard({ title, value, variant = 'default' }: StatsCardProps) {
  const isPrimary = variant === 'primary';
  const base = 'rounded-xl p-4 sm:p-6';
  const primary = 'bg-gradient-to-br from-orange-400 to-orange-500 text-white';
  const secondary = 'bg-white border border-gray-200 text-gray-900';

  return (
    <div className={`${base} ${isPrimary ? primary : secondary}`}>
      <p className={`text-xs sm:text-sm mb-2 ${isPrimary ? 'opacity-90' : 'text-gray-500'}`}>{title}</p>
      <p className="text-lg sm:text-3xl font-bold break-words">{value}</p>
    </div>
  );
}
