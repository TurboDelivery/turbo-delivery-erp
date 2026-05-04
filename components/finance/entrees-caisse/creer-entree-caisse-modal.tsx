'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarInput } from '@/components/block/dateInput';
import {
  entreeCaisseSchema,
  EntreeCaisseCreateDTO,
} from '@/features/entrees-caisse/schemas/entree-caisse.schema';
import { useCreerEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';

export function CreerEntreeCaisseModal() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const mutation = useCreerEntreeCaisseMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EntreeCaisseCreateDTO>({
    resolver: zodResolver(entreeCaisseSchema),
    defaultValues: {
      libelle: '',
      montant: 0,
      dateEntree: format(new Date(), 'yyyy-MM-dd'),
      commentaire: '',
    },
  });

  const onSubmit = async (data: EntreeCaisseCreateDTO) => {
    await mutation.mutateAsync(data);
    reset();
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="libelle">Libellé</Label>
            <Input
              id="libelle"
              {...register('libelle')}
              placeholder="Libellé de l'entrée"
            />
            {errors.libelle && (
              <p className="text-red-500 text-xs">{errors.libelle.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              {...register('montant', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.montant && (
              <p className="text-red-500 text-xs">{errors.montant.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Date d'entrée</Label>
            <CalendarInput
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                if (date) setValue('dateEntree', format(date, 'yyyy-MM-dd'));
              }}
              placeholder="Sélectionnez une date"
            />
            {errors.dateEntree && (
              <p className="text-red-500 text-xs">{errors.dateEntree.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Input
              id="commentaire"
              {...register('commentaire')}
              placeholder="Commentaire (optionnel)"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
