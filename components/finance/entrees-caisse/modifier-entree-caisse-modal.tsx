'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EntreeCaisseCreateDTO } from '@/features/entrees-caisse/schemas/entree-caisse.schema';
import { useModifierEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';
import { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';
import { EntreeCaisseForm } from './entree-caisse-form';

interface ModifierEntreeCaisseModalProps {
  entreeCaisse: IEntreeCaisse;
}

export function ModifierEntreeCaisseModal({ entreeCaisse }: ModifierEntreeCaisseModalProps) {
  const [open, setOpen] = useState(false);
  const mutation = useModifierEntreeCaisseMutation();

  const onSubmit = async (data: EntreeCaisseCreateDTO) => {
    await mutation.mutateAsync({ id: entreeCaisse.id, data });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Modifier l&#39;entrée caisse</DialogTitle>
        </DialogHeader>
        <EntreeCaisseForm
          defaultValues={{
            libelle: entreeCaisse.libelle,
            montant: entreeCaisse.montant,
            dateEntree: entreeCaisse.dateEntree,
            commentaire: entreeCaisse.commentaire,
            paye: entreeCaisse.paye,
          }}
          onSubmit={onSubmit}
          isPending={mutation.isPending}
          submitLabel="Modifier"
        />
      </DialogContent>
    </Dialog>
  );
}
