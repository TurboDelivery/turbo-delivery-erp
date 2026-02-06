'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAjouterInvestissementMutation } from '@/feature-finance/revenus/queries/investissement/investissement.mutation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvestissementCreateDTO, InvestissementCreateSchema } from '@/feature-finance/revenus/schemas/investissement.schema';
import { InvestissementForm } from '../investissement-form';

export function AddInvestModal() {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InvestissementCreateDTO>({
    resolver: zodResolver(InvestissementCreateSchema),
    defaultValues: {
      nomInvestisseur: '',
      montant: 0,
      dateInvestissement: '',
      deadline: '',
    },
  });

  const ajouterInvestissementMutation = useAjouterInvestissementMutation();

  const resetForm = () => {
    reset();
  };

  const onSubmit = async (data: InvestissementCreateDTO) => {
    const formData = {
      nomInvestisseur: data.nomInvestisseur,
      montant: data.montant,
      dateInvestissement: data.dateInvestissement,
      deadline: data.deadline,
    };

    ajouterInvestissementMutation.mutate(formData, {
      onSuccess: () => {
        resetForm();
        setOpen(false);
        toast.success('Investissement créé avec succès !');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus />
          <span className="hidden md:flex">Ajouter Investissement</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95%] sm:max-w-[600px] w-full mt-3 sm:mt-3 md:mt-0">
        <DialogHeader>
          <DialogTitle>Ajouter un investissement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <InvestissementForm register={register} errors={errors} />

          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => resetForm()}>
                Annuler
              </Button>
            </DialogClose>
            <Button variant="secondary" type="submit" className="cursor-pointer" disabled={isSubmitting || ajouterInvestissementMutation.isPending}>
              {isSubmitting || ajouterInvestissementMutation.isPending ? 'Création en cours...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
