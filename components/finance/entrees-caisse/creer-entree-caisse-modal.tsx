'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EntreeCaisseCreateDTO } from '@/features/entrees-caisse/schemas/entree-caisse.schema';
import { useCreerEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';
import { EntreeCaisseForm } from './entree-caisse-form';

export function CreerEntreeCaisseModal() {
  const [open, setOpen] = useState(false);
  const mutation = useCreerEntreeCaisseMutation();

  const onSubmit = async (data: EntreeCaisseCreateDTO) => {
    await mutation.mutateAsync(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle entrée
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nouvelle entrée caisse</DialogTitle>
        </DialogHeader>
        <EntreeCaisseForm
          onSubmit={onSubmit}
          isPending={mutation.isPending}
          submitLabel="Créer"
        />
      </DialogContent>
    </Dialog>
  );
}
