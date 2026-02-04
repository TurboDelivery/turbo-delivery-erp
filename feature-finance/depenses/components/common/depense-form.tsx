'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { IInvestissement } from '../../../revenus/types/revenus.types';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { fr } from 'date-fns/locale';
import { DepenseCreateDTO } from '@/features/depenses/schemas/depense.schema';
import { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';

interface DepenseFormProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  categories: ICategorieDepense[] | undefined;
  categoriesLoading: boolean;
  investissements: IInvestissement[];
  investissementsLoading: boolean;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  defaultCategorieId?: string;
  defaultSource?: string;
}

export function DepenseForm({ selectedDate, setSelectedDate, categories, categoriesLoading, investissements, investissementsLoading, register, errors, setValue, defaultCategorieId, defaultSource }: DepenseFormProps) {
  return (
    <div className="grid gap-6">
      {/* Date et Montant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="dateDepense" className="text-sm text-gray-500">
            Date de la dépense *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-empty={!selectedDate} className="data-[empty=true]:text-muted-foreground w-full justify-between text-left font-normal">
                {selectedDate ? format(selectedDate, 'PPP', { locale: fr }) : <span>Choisissez une date</span>}
                <CalendarIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} defaultMonth={selectedDate} />
            </PopoverContent>
          </Popover>
          {errors.dateDepense && <p className="text-red-500 text-sm">{errors.dateDepense.message as string}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="montant" className="text-sm text-gray-500">
            Montant de la dépense *
          </Label>
          <Input id="montant" placeholder="Montant" type="number" step="0.01" {...register('montant', { valueAsNumber: true })} />
          {errors.montant && <p className="text-red-500 text-sm">{errors.montant.message as string}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Catégorie */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="categorie.id" className="text-sm text-gray-500">
            Catégorie de dépenses *
          </Label>
          <Select onValueChange={(value) => setValue('categorie.id', value)} defaultValue={defaultCategorieId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Catégories</SelectLabel>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>
                    Chargement...
                  </SelectItem>
                ) : categories && categories.length > 0 ? (
                  categories.map((categorie: ICategorieDepense) => (
                    <SelectItem key={categorie.id} value={categorie.id}>
                      {categorie.nomCategorie}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Aucune catégorie disponible
                  </SelectItem>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          {(errors.categorie as any)?.id && <p className="text-red-500 text-sm">{(errors.categorie as any).id.message as string}</p>}
        </div>

        {/* Source */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="sourcePaiement" className="text-sm text-gray-500">
            Source
          </Label>
          <Select onValueChange={(value) => setValue('sourcePaiement', value)} defaultValue={defaultSource}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez une source" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Source</SelectLabel>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="wave">Wave</SelectItem>
                <SelectItem value="orange-money">Orange Money</SelectItem>
                <SelectItem value="mtn-momo">MTN MoMo</SelectItem>
                <SelectItem value="moov-money">Moov money</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {(errors.categorie as any)?.id && <p className="text-red-500 text-sm">{(errors.categorie as any).id.message as string}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-3">
        <Label htmlFor="description" className="text-sm text-gray-500">
          Description *
        </Label>
        <Textarea id="description" placeholder="Description" {...register('description')} />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message as string}</p>}
      </div>

      {/* Investisseur */}
      <div className="grid gap-3">
        <Label htmlFor="investisseur" className="text-sm text-gray-500">
          Investisseur (optionnel)
        </Label>
        <Select onValueChange={(value) => setValue('investisseur', value === 'none' ? '' : value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionnez un investisseur" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Investisseurs</SelectLabel>
              {investissementsLoading ? (
                <SelectItem value="loading" disabled>
                  Chargement...
                </SelectItem>
              ) : investissements && investissements.length > 0 ? (
                <>
                  <SelectItem value="none">Aucun investisseur</SelectItem>
                  {investissements.map((investissement: IInvestissement) => (
                    <SelectItem key={investissement.id} value={investissement.nomInvestisseur}>
                      {investissement.nomInvestisseur} - {investissement.montant.toLocaleString()} FCFA
                    </SelectItem>
                  ))}
                </>
              ) : (
                <SelectItem value="none" disabled>
                  Aucun investisseur disponible
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.investisseur && <p className="text-red-500 text-sm">{errors.investisseur.message as string}</p>}
      </div>
    </div>
  );
}

export default DepenseForm;
