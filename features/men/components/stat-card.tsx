'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  highlight?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  isLink?: boolean;
}

export function StatCard({ label, value, highlight, isActive, onClick, isLink }: StatCardProps) {
  if (isLink) {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer flex items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 px-5 py-4 w-full transition-all duration-150 hover:border-primary hover:bg-primary/10 hover:scale-[1.02] group"
      >
        <span className="text-sm font-medium text-primary">{label}</span>
        <ArrowRight className="w-5 h-5 text-primary opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
      </div>
    );
  }

  if (highlight) {
    return (
      <div
        onClick={onClick}
        className={`cursor-pointer flex items-center justify-between rounded-lg px-5 py-4 text-white w-full transition-all duration-150 ${
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
      className={`cursor-pointer flex items-center justify-between rounded-lg border px-5 py-4 w-full transition-all duration-150 ${
        isActive
          ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 scale-[1.02]'
          : 'border-gray-200 bg-white hover:border-primary/50'
      }`}
    >
      <span className={`text-sm ${isActive ? 'text-primary font-medium' : 'text-black font-extrabold text-md'}`}>{label}</span>
      <span className="text-3xl font-bold text-primary">{value}</span>
    </div>
  );
}
