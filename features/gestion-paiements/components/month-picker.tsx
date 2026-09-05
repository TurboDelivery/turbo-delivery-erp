'use client';

import { Button, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
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
        <Button
          aria-label="Année précédente"
          isIconOnly
          onPress={() => goToMonth(currentYear - 1, currentMonthIndex)}
          size="sm"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" size={16} />
        </Button>
        <span className="min-w-[80px] text-center text-lg font-semibold tabular-nums text-foreground">
          {currentYear}
        </span>
        <Button
          aria-label="Année suivante"
          isIconOnly
          onPress={() => goToMonth(currentYear + 1, currentMonthIndex)}
          size="sm"
          variant="outline"
        >
          <ChevronRight aria-hidden="true" size={16} />
        </Button>
      </div>

      {/*
       * Les douze mois etaient des `<button>` nus dont l'actif etait peint
       * `bg-orange-500` — une teinte qui n'appartient a aucun theme du projet — pour un
       * choix EXCLUSIF, sans navigation au clavier entre les options.
       */}
      <ToggleButtonGroup
        className="flex-wrap justify-center"
        onSelectionChange={(sel) => {
          const i = Number(Array.from(sel)[0]);
          if (!Number.isNaN(i)) goToMonth(currentYear, i);
        }}
        selectedKeys={new Set([String(currentMonthIndex)])}
        selectionMode="single"
        size="sm"
      >
        {MONTH_NAMES.map((name, index) => (
          <ToggleButton id={String(index)} key={name}>
            {name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
