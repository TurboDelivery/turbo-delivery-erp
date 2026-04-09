'use client';

import { Button } from '@heroui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { endOfMonth, format, parse, startOfMonth } from 'date-fns';

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

interface MonthPickerProps {
  debut: string;
  fin: string;
  onChange: (values: { debut: string; fin: string }) => void;
}

export function MonthPicker({ debut, onChange }: MonthPickerProps) {
  const current = parse(debut, 'yyyy-MM-dd', new Date());
  const currentYear = current.getFullYear();
  const currentMonthIndex = current.getMonth();

  const goToMonth = (year: number, monthIndex: number) => {
    const date = new Date(year, monthIndex, 1);
    onChange({
      debut: format(startOfMonth(date), 'yyyy-MM-dd'),
      fin: format(endOfMonth(date), 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="space-y-4">
      {/* Year navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button isIconOnly size="sm" variant="bordered" radius="full" onPress={() => goToMonth(currentYear - 1, currentMonthIndex)}>
          <ChevronLeft size={16} />
        </Button>
        <span className="text-lg font-semibold text-gray-900 min-w-[80px] text-center">{currentYear}</span>
        <Button isIconOnly size="sm" variant="bordered" radius="full" onPress={() => goToMonth(currentYear + 1, currentMonthIndex)}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Month pills */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {MONTH_NAMES.map((name, index) => (
          <button
            key={name}
            onClick={() => goToMonth(currentYear, index)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${index === currentMonthIndex ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
