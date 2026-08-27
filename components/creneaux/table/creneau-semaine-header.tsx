'use client';

import { useMemo, useState } from 'react';
import { Button } from '@heroui/react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatSemaineLabel, generateAllWeeks, SemaineOption } from '@/features/creneaux/utils/semaine.utils';

interface CreneauSemaineHeaderProps {
  selectedSemaine: string;
  fin: string;
  onSemaineChange: (semaine: string) => void;
}

export function CreneauSemaineHeader({ selectedSemaine, fin, onSemaineChange }: CreneauSemaineHeaderProps) {
  const [open, setOpen] = useState(false);
  const weeks = useMemo(() => generateAllWeeks(), []);

  const currentIndex = weeks.findIndex((w) => w.value === selectedSemaine);

  const handlePrev = () => {
    if (currentIndex < weeks.length - 1) {
      onSemaineChange(weeks[currentIndex + 1].value);
    }
  };

  const handleNext = () => {
    if (currentIndex > 0) {
      onSemaineChange(weeks[currentIndex - 1].value);
    }
  };

  const handleSelect = (week: SemaineOption) => {
    onSemaineChange(week.value);
    setOpen(false);
  };

  const hasPrev = currentIndex < weeks.length - 1;
  const hasNext = currentIndex > 0;

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <Button
        isIconOnly
        variant="light"
        size="sm"
        onPress={handlePrev}
        isDisabled={!hasPrev}
        aria-label="Semaine precedente"
      >
        <ChevronLeft className="size-5" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-default-200 bg-white px-4 py-2 text-lg font-semibold shadow-sm transition-colors hover:bg-default-100"
          >
            <CalendarDays className="size-5 text-default-500" />
            {formatSemaineLabel(selectedSemaine, fin)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="center">
          <div className="border-b px-3 py-2">
            <p className="text-sm font-medium text-default-600">Selectionner une semaine</p>
          </div>
          <ScrollArea className="h-72">
            <div className="p-1">
              {weeks.map((week) => (
                <button
                  key={week.value}
                  type="button"
                  onClick={() => handleSelect(week)}
                  className={cn(
                    'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-default-100',
                    week.value === selectedSemaine && 'bg-primary-50 font-medium text-primary',
                  )}
                >
                  {week.label}
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Button
        isIconOnly
        variant="light"
        size="sm"
        onPress={handleNext}
        isDisabled={!hasNext}
        aria-label="Semaine suivante"
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
