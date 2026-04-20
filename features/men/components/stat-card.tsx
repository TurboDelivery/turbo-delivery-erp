'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  highlight?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export function StatCard({ label, value, highlight, isActive, onClick }: StatCardProps) {
  if (highlight) {
    return (
      <div
        onClick={onClick}
        className={`cursor-pointer flex items-center justify-between rounded-lg px-5 py-4 text-white min-w-[180px] transition-all duration-150 ${
          isActive
            ? 'bg-primary ring-2 ring-primary ring-offset-2 scale-[1.02]'
            : 'bg-primary/80 hover:bg-primary'
        }`}
      >
        <span className="text-sm font-medium opacity-90">{label}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer flex items-center justify-between rounded-lg border px-5 py-4 min-w-[140px] transition-all duration-150 ${
        isActive
          ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 scale-[1.02]'
          : 'border-gray-200 bg-white hover:border-primary/50'
      }`}
    >
      <span className={`text-sm ${isActive ? 'text-primary font-medium' : 'text-gray-600'}`}>{label}</span>
      <span className="text-3xl font-bold text-primary">{value}</span>
    </div>
  );
}
