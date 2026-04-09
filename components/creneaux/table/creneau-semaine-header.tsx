'use client';

import { Button } from '@heroui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatSemaineLabel } from '@/features/creneaux/utils/creneau.utils';

interface CreneauSemaineHeaderProps {
  debut: string;
  fin: string;
  onPrev?: () => void;
  onNext?: () => void;
}

export function CreneauSemaineHeader({ debut, fin, onPrev, onNext }: CreneauSemaineHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <Button isIconOnly variant="light" size="sm" onPress={onPrev} aria-label="Semaine precedente">
        <ChevronLeft className="size-5" />
      </Button>
      <h3 className="text-lg font-semibold">{formatSemaineLabel(debut, fin)}</h3>
      <Button isIconOnly variant="light" size="sm" onPress={onNext} aria-label="Semaine suivante">
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
