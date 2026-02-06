'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Edit } from 'lucide-react';
import { useModifierInvestissementMutation } from '@/feature-finance/revenus/queries/investissement/investissement.mutation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvestissementUpdateDTO, InvestissementUpdateSchema } from '@/feature-finance/revenus/schemas/investissement.schema';
import { IInvestissement } from '@/feature-finance/revenus/types/revenus.types';
import { InvestissementForm } from '../investissement-form';

interface ModifierInvestModalProps {
  investissement: IInvestissement;
}

export function ModifierInvestModal({ investissement }: ModifierInvestModalProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<InvestissementUpdateDTO>({
    resolver: zodResolver(InvestissementUpdateSchema),
    defaultValues: {
      nomInvestisseur: investissement.nomInvestisseur,
      montant: investissement.montant,
      dateInvestissement: investissement.dateInvestissement,
      deadline: investissement.deadline,
    },
  });

  const modifierInvestissementMutation = useModifierInvestissementMutation();

  const onSubmit = async (data: InvestissementUpdateDTO) => {
    const formData = {
      nomInvestisseur: data.nomInvestisseur,
      montant: data.montant,
      dateInvestissement: data.dateInvestissement,
      deadline: data.deadline,
    };

    modifierInvestissementMutation.mutate(
      {
        id: investissement.id,
        data: formData,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
          toast.success('Investissement modifié avec succès', {
            description: `L'investissement de "${formData.nomInvestisseur}" a été modifié avec succès`,
            duration: 4000,
          });
        },
        onError: () => {
          toast.error('Erreur lors de la modification', {
            description: "Une erreur s'est produite lors de la modification",
            duration: 4000,
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 cursor-pointer hover:text-blue-800 transition-colors">
          <Edit className="h-5 w-5 text-amber-500" />
          <span className="hidden md:flex text-sm font-medium">Modifier</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[95%] sm:max-w-[600px] w-full mt-3 sm:mt-3 md:mt-0">
        <DialogHeader>
          <DialogTitle>Modifier un investissement</DialogTitle>
          <DialogDescription>Modifiez les informations de l&apos;investissement de {investissement.nomInvestisseur}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <InvestissementForm register={register as any} errors={errors} defaultValues={investissement} />

          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => reset()}>
                Annuler
              </Button>
            </DialogClose>
            <Button variant="secondary" type="submit" className="cursor-pointer" disabled={isSubmitting || modifierInvestissementMutation.isPending}>
              {isSubmitting || modifierInvestissementMutation.isPending ? 'Modification en cours...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
