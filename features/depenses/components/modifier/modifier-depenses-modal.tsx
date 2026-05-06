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
import { useInvestissementList } from '@/features/revenus/hooks/use-investissement-list';
import { DepenseForm } from '../common/depense-form';

interface ModifierDepenseModalProps {
  depense: IDepense;
}

export function ModifierDepenseModal({ depense }: ModifierDepenseModalProps) {
  const [dateDepense, setDateDepense] = useState<Date | undefined>(depense.dateDepense ? new Date(depense.dateDepense) : new Date());
  const [open, setOpen] = useState(false);
  const [showTypeDepense, setShowTypeDepense] = useState<boolean>(!!depense.typeDepense);
  const { data: categories, isLoading: categoriesLoading } = useCategorieDepensesListQuery({});
  const { investissements, isLoading: investissementsLoading } = useInvestissementList();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<DepenseUpdateDTO>({
    resolver: zodResolver(DepenseUpdateSchema),
    defaultValues: {
      montant: depense.montant,
      description: depense.description,
      dateDepense: new Date(depense.dateDepense),
      categorieDepense: depense.categorie.id,
      typeDepense: depense.typeDepense,
      sourcePaiement: depense.sourcePaiement,
    },
  });

  // Synchroniser les dates avec le form
  useEffect(() => {
    if (depense.dateDepense) {
      setDateDepense(new Date(depense.dateDepense));
    }
    setValue('montant', depense.montant);
    setValue('description', depense.description);
    setValue('categorieDepense', depense.categorie?.id || '');
    setValue('typeDepense', depense.typeDepense);
    setValue('sourcePaiement', depense.sourcePaiement);
  }, [depense, setValue]);

  const modifierDepenseMutation = useModifierDepenseMutation();

  // Gestion de la soumission du formulaire
  const onSubmit = async (data: DepenseUpdateDTO) => {
    try {
      const formData = {
        ...data,
        dateDepense: dateDepense || data.dateDepense,
        typeDepense: showTypeDepense ? data.typeDepense : null,
      };

      await modifierDepenseMutation.mutateAsync({
        id: depense.id,
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
            investissements={investissements}
            investissementsLoading={investissementsLoading}
            register={register}
            errors={errors}
            setValue={setValue}
            defaultCategorieId={depense.categorie?.id}
            defaultSource={depense.sourcePaiement}
            defaultInvestissementId={depense.investissement?.id}
            defaultTypeDepense={depense.typeDepense}
            showTypeDepense={showTypeDepense}
            onShowTypeDepenseChange={setShowTypeDepense}
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
