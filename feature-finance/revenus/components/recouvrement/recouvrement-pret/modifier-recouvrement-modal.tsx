'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { RecouvrementEditDTO, recouvrementEditSchema } from '@/feature-finance/revenus/schemas/recouvrement/recouvrement.schema';
import { useModifierRecouvrementMutation } from '@/features/recouvrements/queries/recouvrement.mutation';
import { usePretListQuery } from '@/feature-finance/revenus/queries/prets/pret-list.query';
import { IRecouvrement } from '@/feature-finance/revenus/types/recouvrement/recouvrement.types';
import { RecouvrementForm } from './recouvrement-form';
import { createUrlFile } from '@/utils/createUrlFile';

interface ModifierRecouvrementModalProps {
  recouvrement: IRecouvrement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModifierRecouvrementModal({ recouvrement, open, onOpenChange }: ModifierRecouvrementModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(recouvrement.dateRecouvrement));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: factures = [] } = usePretListQuery({});

  const form = useForm<RecouvrementEditDTO>({
    resolver: zodResolver(recouvrementEditSchema),
    defaultValues: {
      montant: recouvrement.montant,
      dateRecouvrement: new Date(recouvrement.dateRecouvrement),
      restaurantId: recouvrement.restaurantId,
      factureId: '',
      preuve: undefined,
    },
  });

  const { handleSubmit, reset, setValue } = form;
  const { mutateAsync: modifierMutation, isPending: isLoading } = useModifierRecouvrementMutation();

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset({
        montant: 0,
        dateRecouvrement: new Date(),
        restaurantId: '',
        factureId: '',
        preuve: undefined,
      });
      setSelectedDate(new Date());
      setSelectedFile(null);
    }

    onOpenChange(nextOpen);
  };

  // Réinitialiser le formulaire à chaque ouverture avec les données du recouvrement
  useEffect(() => {
    if (open) {
      const date = new Date(recouvrement.dateRecouvrement);
      setSelectedDate(date);
      setSelectedFile(null);
      reset({
        montant: recouvrement.montant,
        dateRecouvrement: date,
        restaurantId: recouvrement.restaurantId,
        factureId: '',
        preuve: undefined,
      });
    }
  }, [open, recouvrement, reset]);

  const onSubmitForm = async (data: RecouvrementEditDTO) => {
    await modifierMutation(
      {
        id: recouvrement.id,
        data: { ...data, preuve: selectedFile ?? undefined },
      },
      {
        onSuccess: () => {
          handleDialogOpenChange(false);
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
    const d = date || new Date();
    setSelectedDate(d);
    setValue('dateRecouvrement', d, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier le recouvrement</DialogTitle>
          <DialogDescription>Modifiez les informations du recouvrement</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <RecouvrementForm
            form={form}
            factures={factures}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onFileChange={handleFileChange}
            selectedFileName={selectedFile?.name}
            preuveExistanteUrl={recouvrement.preuve ? createUrlFile(recouvrement.preuve, 'backend') : undefined}
            isEdit
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" variant="secondary" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
