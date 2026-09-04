'use client';

import { CalendarDays } from 'lucide-react';
import { ICreneauActifVm } from '@/features/creneaux/types/creneau.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  creneaux: ICreneauActifVm[];
  selectedCreneauId: string | null | undefined;
  onSelectCreneau: (id: string | undefined) => void;
  disabled?: boolean;
}

export default function CreneauSelectPicker({
  creneaux,
  selectedCreneauId,
  onSelectCreneau,
  disabled,
}: Props) {
  return (
    <Select
      value={selectedCreneauId ?? ''}
      onValueChange={(v) => onSelectCreneau(v || undefined)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full sm:w-64 gap-2 text-sm font-medium">
        <CalendarDays className="h-4 w-4 shrink-0 text-muted" />
        <SelectValue placeholder="Choisir un créneau…" />
      </SelectTrigger>
      <SelectContent>
        {creneaux.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
