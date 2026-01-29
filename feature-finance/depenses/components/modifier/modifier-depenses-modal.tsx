'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IDepense } from '@/features/depenses/types/depense.type';
import { DepenseUpdateDTO, DepenseUpdateSchema } from '@/features/depenses/schemas/depense.schema';
import { useModifierDepenseMutation } from '../../queries/depense.mutation';
import { useCategorieDepensesListQuery } from '../../queries/category/categorie-depense.query';
import { DepenseForm } from '../common/depense-form';

interface ModifierDepenseModalProps {
  depenses: IDepense;
}

export function ModifierDepenseModal({ depenses }: ModifierDepenseModalProps) {
  const [dateDepense, setDateDepense] = useState<Date | undefined>(depenses.dateDepense ? new Date(depenses.dateDepense) : new Date());
  const [open, setOpen] = useState(false);
  const { data: categories, isLoading: categoriesLoading } = useCategorieDepensesListQuery({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<DepenseUpdateDTO>({
    resolver: zodResolver(DepenseUpdateSchema),
    defaultValues: {
      montant: depenses.montant,
      description: depenses.description,
      dateDepense: new Date(depenses.dateDepense),
      categorie: depenses.categorie,
    },
  });

  // Synchroniser les dates avec le form
  useEffect(() => {
    if (depenses.dateDepense) {
      setDateDepense(new Date(depenses.dateDepense));
    }
    setValue('montant', depenses.montant);
    setValue('description', depenses.description);
    setValue('categorie.id', depenses.categorie?.id || '');
  }, [depenses, setValue]);

  const modifierDepenseMutation = useModifierDepenseMutation();

  // Gestion de la soumission du formulaire
  const onSubmit = async (data: DepenseUpdateDTO) => {
    try {
      const formData = {
        description: data.description,
        montant: data.montant,
        dateDepense: dateDepense || data.dateDepense,
        categorie: data.categorie,
      };

      await modifierDepenseMutation.mutateAsync({
        id: depenses.id,
        data: formData,
      });

      reset();
      setOpen(false);

      toast.success('Dépense modifiée avec succès', {
        description: `La dépense a été modifiée`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Erreur lors de la modification de la dépense:', error);
      toast.error('Erreur lors de la modification', {
        description: "Une erreur s'est produite lors de la modification",
        duration: 4000,
      });
    }
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
          <DialogTitle>Modifier la dépense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DepenseForm
            selectedDate={dateDepense}
            setSelectedDate={setDateDepense}
            categories={categories}
            categoriesLoading={categoriesLoading}
            register={register}
            errors={errors}
            setValue={setValue}
            defaultCategorieId={depenses.categorie?.id}
          />

          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || modifierDepenseMutation.isPending}>
              {isSubmitting || modifierDepenseMutation.isPending ? 'Modification...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
