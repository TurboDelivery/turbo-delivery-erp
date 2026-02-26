'use client';

import { CalendarInput } from '@/components/components-finance/block/dateInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecouvrementCreateDTO } from '@/feature-finance/revenus/schemas/recouvrement/recouvrement.schema';
import { IFacture } from '@/feature-finance/revenus/types/recouvrement/prets.types';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface RecouvrementFormProps {
  form: UseFormReturn<RecouvrementCreateDTO>;
  factures: IFacture[];
  selectedDate: Date;
  onDateChange: (date?: Date) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFileName?: string;
  disableRestaurant?: boolean;
  /** En mode édition, la preuve n'est pas obligatoire */
  isEdit?: boolean;
  /** URL de la preuve existante (pour le bouton télécharger en mode édition) */
  preuveExistanteUrl?: string;
}

export function RecouvrementForm({
  form,
  factures,
  selectedDate,
  onDateChange,
  onFileChange,
  selectedFileName,
  disableRestaurant = false,
  isEdit = false,
  preuveExistanteUrl,
}: RecouvrementFormProps) {
  const {
    register,
    formState: { errors },
    setValue,
    control,
    watch,
  } = form;

  const watchedRestaurantId = watch('restaurantId');

  return (
    <div className="space-y-4">
      {/* Sélection facture / restaurant */}
      <div>
        <Label>Restaurant *</Label>
        <Controller
          name="restaurantId"
          control={control}
          render={() => (
            <Select
              disabled={disableRestaurant}
              value={watchedRestaurantId}
              onValueChange={(value) => setValue('restaurantId', value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un restaurant" />
              </SelectTrigger>
              <SelectContent>
                {factures.map((facture: IFacture) => (
                  <SelectItem key={facture.id} value={facture.id}>
                    {facture.nomRestaurant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.restaurantId && <small className="text-red-500 text-sm">{errors.restaurantId.message}</small>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Montant */}
        <div>
          <Label>Montant *</Label>
          <Input type="number" {...register('montant', { valueAsNumber: true })} />
          {errors.montant && <small className="text-red-500 text-sm">{errors.montant.message}</small>}
        </div>

        {/* Date */}
        <div>
          <Label>Date *</Label>
          <CalendarInput value={selectedDate} onChange={onDateChange} />
          {errors.dateRecouvrement && <small className="text-red-500 text-sm">{errors.dateRecouvrement.message}</small>}
        </div>
      </div>

      {/* Fichier */}
      <div>
        <Label>Preuve {isEdit ? '(laisser vide pour conserver)' : '*'}</Label>
        <div className="flex items-center gap-2">
          {/* Bouton télécharger la preuve existante — visible uniquement en mode édition */}
          {isEdit && preuveExistanteUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => window.open(preuveExistanteUrl, '_blank')}
            >
              <Download className="size-4" />
              <span>Preuve actuelle</span>
            </Button>
          )}
          <Input type="file" accept="image/*,application/pdf" onChange={onFileChange} className="flex-1" />
        </div>
        {selectedFileName && <small className="text-muted-foreground text-xs mt-1 block">Fichier sélectionné : {selectedFileName}</small>}
        {errors.preuve && <small className="text-red-500 text-sm">{errors.preuve.message}</small>}
      </div>
    </div>
  );
}
