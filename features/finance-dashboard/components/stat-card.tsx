'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down';
  isLoading: boolean;
  clickable?: boolean;
  onClick?: () => void;
  showCurrency?: boolean;
  additionalInfo?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  trend,
  isLoading,
  clickable = false,
  onClick,
  showCurrency = true,
  additionalInfo,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white">
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col items-start gap-3 flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
            {additionalInfo && <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />}
          </div>

          <div className={`p-3 rounded-full ${bgColor} opacity-50`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-6 flex flex-col items-center justify-center rounded-xl border border-gray-100 transition-all bg-white ${
        clickable ? 'cursor-pointer hover:shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col items-start gap-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="flex items-center gap-2">
            <p className={`text-md font-bold ${color}`}>
              {value.toLocaleString()} {showCurrency && 'FCFA'}
            </p>
            {trend && (
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full ${
                  trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {trend === 'up' ? (
                  <ArrowUp className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-600" />
                )}
              </div>
            )}
          </div>
          {additionalInfo && <p className={`text-xs font-medium ${color}`}>{additionalInfo}</p>}
        </div>

        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

