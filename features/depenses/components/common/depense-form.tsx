'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { IInvestissement } from '@/features/revenus/types/revenus.types';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { fr } from 'date-fns/locale';
import { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { Switch } from '@/components/ui/switch';

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
  defaultInvestissementId?: string;
  defaultTypeDepense?: string;
  defaultStatut?: string;
  showTypeDepense?: boolean;
  onShowTypeDepenseChange?: (checked: boolean) => void;
}

export function DepenseForm({
  selectedDate,
  setSelectedDate,
  categories,
  categoriesLoading,
  investissements,
  investissementsLoading,
  register,
  errors,
  setValue,
  defaultCategorieId,
  defaultSource,
  defaultInvestissementId,
  defaultTypeDepense,
  defaultStatut,
  showTypeDepense = false,
  onShowTypeDepenseChange,
}: DepenseFormProps) {
  const [selectedStatut, setSelectedStatut] = useState(defaultStatut || "PENDING");

  useEffect(() => {
    if (defaultStatut) {
      setSelectedStatut(defaultStatut);
      setValue('statut', defaultStatut);
    }
  }, [defaultStatut, setValue]);
  return (
    <div className="grid gap-6">
      {/* Date et Montant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="dateDepense" className="text-sm text-gray-500">
            Date de comptabilisation *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                data-empty={!selectedDate}
                className="data-[empty=true]:text-muted-foreground w-full justify-between text-left font-normal"
              >
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
          <Input 
            id="montant" 
            placeholder="Montant" 
            type="number" 
            step="0.01" 
            {...register('montant', { 
              valueAsNumber: true,
              onChange: (e) => {
                const value = parseFloat(e.target.value);
                setValue('montant', isNaN(value) ? 0 : value);
              }
            })} 
          />
          {errors.montant && <p className="text-red-500 text-sm">{errors.montant.message as string}</p>}
        </div>
      </div>

      {/* Statut */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="statut" className="text-sm text-gray-500">
          Statut de la dépense *
        </Label>
        <Select 
          value={selectedStatut}
          onValueChange={(value) => {
            setSelectedStatut(value);
            setValue('statut', value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionnez le statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Statut</SelectLabel>
              <SelectItem value="PAID">Payée</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.statut && <p className="text-red-500 text-sm">{errors.statut.message as string}</p>}
      </div>

      {/* Catégorie + Source */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="categorieDepense" className="text-sm text-gray-500">
            Catégorie de dépenses *
          </Label>
          <Select onValueChange={(value) => setValue('categorieDepense', value)} defaultValue={defaultCategorieId}>
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
          {errors.categorieDepense && <p className="text-red-500 text-sm">{errors.categorieDepense.message as string}</p>}
        </div>

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
          {errors.sourcePaiement && <p className="text-red-500 text-sm">{errors.sourcePaiement.message as string}</p>}
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

      {/* Dépense récurrente */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Switch
            id="toggle-type-depense"
            checked={showTypeDepense}
            onCheckedChange={(checked) => {
              onShowTypeDepenseChange?.(checked);
              if (!checked) {
                setValue('typeDepense', null);
                setValue('periodicite', null);
              }
            }}
          />
          <Label htmlFor="toggle-type-depense" className="text-sm text-gray-500 cursor-pointer">
            Dépense récurrente (fixe)
          </Label>
        </div>
        {showTypeDepense && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Select onValueChange={(value) => setValue('typeDepense', value)} defaultValue={defaultTypeDepense ?? undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type de dépense" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Type</SelectLabel>
                    <SelectItem value="FIXE">Fixe</SelectItem>
                    <SelectItem value="VARIABLE">Variable</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.typeDepense && <p className="text-red-500 text-sm">{errors.typeDepense.message as string}</p>}
            </div>
            
            <div className="flex flex-col gap-1">
              <Select onValueChange={(value) => setValue('periodicite', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Périodicité</SelectLabel>
                    <SelectItem value="QUOTIDIEN">Quotidien</SelectItem>
                    <SelectItem value="HEBDOMADAIRE">Hebdomadaire</SelectItem>
                    <SelectItem value="MENSUEL">Mensuel</SelectItem>
                    <SelectItem value="ANNUEL">Annuel</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.periodicite && <p className="text-red-500 text-sm">{errors.periodicite.message as string}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Investisseur */}
      <div className="grid gap-3">
        <Label htmlFor="investisseur" className="text-sm text-gray-500">
          Investissement (optionnel)
        </Label>
        <Select
          onValueChange={(value) => setValue('investissementId', value === 'none' ? '' : value)}
          defaultValue={defaultInvestissementId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionnez un investissement" />
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
                    <SelectItem key={investissement.id} value={investissement.id}>
                      {investissement.nomInvestisseur} - {formatCFA(investissement.montant)}
                    </SelectItem>
                  ))}
                </>
              ) : (
                <SelectItem value="none" disabled>
                  Aucun investissement
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.investissementId && <p className="text-red-500 text-sm">{errors.investissementId.message as string}</p>}
      </div>
    </div>
  );
}

export default DepenseForm;
