'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

type InvestissementFormData = {
  nomInvestisseur: string;
  montant: number;
  dateInvestissement: string;
  deadline: string;
};

interface InvestissementFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  defaultValues?: Partial<InvestissementFormData>;
}

export function InvestissementForm({ register, errors, defaultValues }: InvestissementFormProps) {
  return (
    <div className="grid gap-6">
      {/* Nom et Montant sur la même ligne - EN HAUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nom de l'investisseur avec autofocus */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="nomInvestisseur" className="text-sm font-medium">
            Nom de l&apos;investisseur
          </Label>
          <Input
            id="nomInvestisseur"
            placeholder="Ex: Jean Dupont"
            type="text"
            {...register('nomInvestisseur')}
            className="h-10"
            autoFocus
          />
          {errors.nomInvestisseur && (
            <p className="text-red-500 text-sm">{String(errors.nomInvestisseur.message || '')}</p>
          )}
        </div>

        {/* Montant */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="montant" className="text-sm font-medium">
            Montant de l&apos;investissement
          </Label>
          <div className="relative">
            <Input
              id="montant"
              placeholder="0"
              type="number"
              step="0.01"
              {...register('montant', { valueAsNumber: true })}
              className="h-10 pr-16"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-muted text-sm">FCFA</span>
            </div>
          </div>
          {errors.montant && (
            <p className="text-red-500 text-sm">{String(errors.montant.message || '')}</p>
          )}
        </div>
      </div>

      {/* Dates sur la même ligne */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date de l'investissement */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="dateInvestissement" className="text-sm font-medium">
            Date de l&apos;investissement
          </Label>
          <Input
            id="dateInvestissement"
            type="date"
            {...register('dateInvestissement')}
            className="h-10"
            defaultValue={defaultValues?.dateInvestissement}
          />
          {errors.dateInvestissement && (
            <p className="text-red-500 text-sm">{String(errors.dateInvestissement.message || '')}</p>
          )}
        </div>

        {/* Échéance */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="deadline" className="text-sm font-medium">
            Échéance
          </Label>
          <Input
            id="deadline"
            type="date"
            {...register('deadline')}
            className="h-10"
            defaultValue={defaultValues?.deadline}
          />
          {errors.deadline && (
            <p className="text-red-500 text-sm">{String(errors.deadline.message || '')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
