'use client';

import { useState } from 'react';
import { Card } from '@heroui/react';
import { CardContent } from '@/components/ui/card';
import { useBilanAnnuel } from '../hooks/use-bilan-annuel';
import { EntreeCaisseMiniTable } from '@/components/finance/entrees-caisse/entree-caisse-mini-table';
import { DashboardHeader } from './dashboard-header';
import { MonthCard } from './month-card';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const years = Array.from(
  { length: currentYear - 2024 + 1 },
  (_, i) => String(2024 + i),
);

export default function DashboardPerformance() {
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { monthsData } = useBilanAnnuel(selectedYear);

  const visibleMonths = monthsData.filter((month) => {
    if (selectedYear !== String(currentYear)) return true;
    return month.progress <= currentMonth;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <DashboardHeader
        selectedYear={selectedYear}
        years={years}
        onYearChange={setSelectedYear}
      />

      <div className="space-y-6">
        {visibleMonths.map((month) => (
          <MonthCard key={month.month} month={month} />
        ))}
      </div>

      <div className="mt-8">
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <EntreeCaisseMiniTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
