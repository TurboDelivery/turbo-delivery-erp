'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  entreeCaisseSchema,
  EntreeCaisseCreateDTO,
} from '@/features/entrees-caisse/schemas/entree-caisse.schema';

const MOIS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

const currentYear = new Date().getFullYear();
const ANNEES = Array.from({ length: currentYear - 2024 + 1 }, (_, i) =>
  String(2024 + i),
);

function buildDateEntree(month: string, year: string): string {
  return `${year}-${month}-05`;
}

function parseDateEntree(dateEntree: string): { month: string; year: string } {
  const [year, month] = dateEntree.split('-');
  return { month, year };
}

interface EntreeCaisseFormProps {
  defaultValues?: Partial<EntreeCaisseCreateDTO>;
  onSubmit: (data: EntreeCaisseCreateDTO) => Promise<void>;
  isPending: boolean;
  submitLabel: string;
}

export function EntreeCaisseForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: EntreeCaisseFormProps) {
  const now = new Date();
  const initialDate = defaultValues?.dateEntree
    ? parseDateEntree(defaultValues.dateEntree)
    : {
        month: String(now.getMonth() + 1).padStart(2, '0'),
        year: String(currentYear),
      };

  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [statut, setStatut] = useState(defaultValues?.paye ? 'paye' : 'non_paye');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EntreeCaisseCreateDTO>({
    resolver: zodResolver(entreeCaisseSchema),
    defaultValues: {
      libelle: '',
      montant: 0,
      commentaire: '',
      paye: false,
      ...defaultValues,
      dateEntree: buildDateEntree(initialDate.month, initialDate.year),
    },
  });

  const handleStatutChange = (value: string) => {
    setStatut(value);
    setValue('paye', value === 'paye');
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setValue('dateEntree', buildDateEntree(month, selectedYear));
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setValue('dateEntree', buildDateEntree(selectedMonth, year));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="libelle">Libellé</Label>
        <Input
          id="libelle"
          {...register('libelle')}
          placeholder="Libellé de l'entrée"
        />
        {errors.libelle && (
          <p className="text-red-500 text-xs">{errors.libelle.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="space-y-2 flex-1">
          <Label>Période</Label>
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {MOIS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {ANNEES.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.dateEntree && (
            <p className="text-red-500 text-xs">{errors.dateEntree.message}</p>
          )}
        </div>

        <div className="space-y-2 w-36">
          <Label htmlFor="montant">Montant (FCFA)</Label>
          <Input
            id="montant"
            type="number"
            {...register('montant', { valueAsNumber: true })}
            placeholder="0"
          />
          {errors.montant && (
            <p className="text-red-500 text-xs">{errors.montant.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Statut</Label>
        <Select value={statut} onValueChange={handleStatutChange}>
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="non_paye">Non payée</SelectItem>
            <SelectItem value="paye">Payée</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Une entrée non payée reste dans le CA mais n&apos;est pas comptée dans l&apos;encaissé.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commentaire">Commentaire</Label>
        <Textarea
          id="commentaire"
          {...register('commentaire')}
          placeholder="Commentaire (optionnel)"
          rows={3}
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" size="sm">
            Annuler
          </Button>
        </DialogClose>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? `${submitLabel}...` : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
