'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { RecouvrementCreateDTO, recouvrementFormSchema } from '@/feature-finance/revenus/schemas/recouvrement/recouvrement.schema';
import { useAjouterRecouvrementMutation } from '@/features/recouvrements/queries/recouvrement.mutation';
import { usePretListQuery } from '@/feature-finance/revenus/queries/prets/pret-list.query';
import { IFacture } from '@/feature-finance/revenus/types/recouvrement/prets.types';
import { RecouvrementForm } from './recouvrement-form';

export function CreerRecouvrementModal({ restaurantId, variant = 'ghost' }: { restaurantId?: string; variant?: 'ghost' | 'outline' }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: factures = [] } = usePretListQuery({});

  const form = useForm<RecouvrementCreateDTO>({
    resolver: zodResolver(recouvrementFormSchema),
    defaultValues: {
      montant: 0,
      dateRecouvrement: new Date(),
      restaurantId: restaurantId || '',
      preuve: undefined,
    },
  });

  const { handleSubmit, reset, setValue } = form;

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
      { ...data, preuve: selectedFile, factureDetails: facture },
      {
        onSuccess: () => {
          reset();
          setSelectedDate(new Date());
          setSelectedFile(null);
          setOpen(false);
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
    if (date) setValue('dateRecouvrement', date, { shouldValidate: true });
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
          <RecouvrementForm
            form={form}
            factures={factures}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onFileChange={handleFileChange}
            selectedFileName={selectedFile?.name}
            disableRestaurant={!!restaurantId}
          />

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
