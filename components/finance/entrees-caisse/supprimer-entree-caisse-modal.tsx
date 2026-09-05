'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';
import { useSupprimerEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';

interface SupprimerEntreeCaisseModalProps {
  entreeCaisse: IEntreeCaisse;
}

export function SupprimerEntreeCaisseModal({ entreeCaisse }: SupprimerEntreeCaisseModalProps) {
  const mutation = useSupprimerEntreeCaisseMutation();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l&apos;entrée caisse</AlertDialogTitle>
          <AlertDialogDescription>
            Supprimer «{entreeCaisse.libelle}» ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutation.mutate(entreeCaisse.id)}
            className="bg-red-500 hover:bg-red-600"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Suppression...' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
