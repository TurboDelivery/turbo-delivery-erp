'use client';

import { useCallback, useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash } from 'lucide-react';
import { useSupprimerInvestissementMutation } from '@/feature-finance/revenus/queries/investissement/investissement.mutation';
import { IInvestissement } from '@/feature-finance/revenus/types/revenus.types';

type Props = {
  investissement: IInvestissement | null;
};

export default function SupprimerInvestissementModal({ investissement }: Props) {
  const [open, setOpen] = useState(false);
  const { mutate: supprimerInvestissementMutation, isPending } = useSupprimerInvestissementMutation();

  const handleDelete = useCallback(async () => {
    if (!investissement) {
      toast.error('Investissement introuvable.');
      return;
    }
    supprimerInvestissementMutation(investissement.id, {
      onSuccess: () => {
        toast.success('Investissement supprimé avec succès.');
        setOpen(false);
      },
      onError: () => {
        toast.error("Erreur lors de la suppression de l'investissement.");
      },
    });
  }, [supprimerInvestissementMutation, investissement]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 cursor-pointer hover:text-blue-800 transition-colors">
          <Trash className="h-5 w-5 text-red-500" />
          <span className="hidden md:flex text-sm font-medium">Supprimer</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{`Supprimer l'investissement de ${investissement?.nomInvestisseur} ?`}</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce investissement ?
            <br />
            <strong className="text-red-500">Cette action est irréversible.</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer" disabled={isPending} onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" className="cursor-pointer" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
