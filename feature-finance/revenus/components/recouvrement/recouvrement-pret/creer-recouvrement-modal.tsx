'use client';

import { CalendarInput } from '@/components/components-finance/block/dateInput';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useState } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecouvrementCreateDTO, recouvrementFormSchema } from '@/feature-finance/revenus/schemas/recouvrement/recouvrement.schema';
import { useAjouterRecouvrementMutation } from '@/features/recouvrements/queries/recouvrement.mutation';
import { usePretListQuery } from '@/feature-finance/revenus/queries/prets/pret-list.query';
import { IFacture } from '@/feature-finance/revenus/types/recouvrement/prets.types';

export function CreerRecouvrementModal({ restaurantId, variant="ghost" }: { restaurantId?: string, variant?: 'ghost' | 'outline' }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: factures = [] } = usePretListQuery({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    control,
    watch,
  } = useForm<RecouvrementCreateDTO>({
    resolver: zodResolver(recouvrementFormSchema),
    defaultValues: {
      montant: 0,
      dateRecouvrement: new Date(),
      restaurantId: restaurantId || '',
      preuve: undefined,
    },
  });

  const watchedRestaurantId = watch('restaurantId');

  const { mutateAsync: recouvrementCreateMutation, isPending: isLoading } = useAjouterRecouvrementMutation();

  const onSubmitForm = async (data: RecouvrementCreateDTO) => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier de preuve');
      return;
    }

    const facture = factures.find((f: IFacture) => f.id === data.restaurantId);

    if (!facture) {
      toast.error('Facture sélectionnée introuvable');
      return;
    }

    await recouvrementCreateMutation(
      {
        ...data,
        preuve: selectedFile,
        factureDetails: facture,
      },
      {
        onSuccess: () => {
          reset();
          setSelectedDate(new Date());
          setSelectedFile(null);
          setOpen(false);
          toast.success('Recouvrement créé avec succès');
        },
      },
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('preuve', file);
    }
  };

  const handleDateChange = (date?: Date) => {
    setSelectedDate(date || new Date());
    if (date) {
      setValue('dateRecouvrement', date, { shouldValidate: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus size={18} />
          Effectuer un recouvrement
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un recouvrement</DialogTitle>
          <DialogDescription>Ajoutez un nouveau recouvrement</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Sélection facture */}
          <div>
            <Label>Restaurant *</Label>
            <Controller
              name="restaurantId"
              control={control}
              render={() => (
                <Select
                  disabled={!!restaurantId}
                  value={watchedRestaurantId}
                  onValueChange={(value) => {
                    setValue('restaurantId', value, { shouldValidate: true });
                  }}
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
              <CalendarInput value={selectedDate} onChange={handleDateChange} />
              {errors.dateRecouvrement && <small className="text-red-500 text-sm">{errors.dateRecouvrement.message}</small>}
            </div>
          </div>

          {/* Fichier */}
          <div>
            <Label>Preuve *</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            {errors.preuve && <small className="text-red-500 text-sm">{errors.preuve.message}</small>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>

            <Button type="submit" variant="secondary" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
