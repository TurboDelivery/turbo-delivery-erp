'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { DepenseCreateDTO, DepenseCreateSchema } from '@/features/depenses/schemas/depense.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { useAjouterDepenseMutation } from '../../queries/depense.mutation';
import { useCategorieDepensesListQuery } from '../../queries/category/categorie-depense.query';
import { DepenseForm } from '../common/depense-form';

export function CreerDepenseModal() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useCategorieDepensesListQuery({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<DepenseCreateDTO>({
    resolver: zodResolver(DepenseCreateSchema),
    defaultValues: {
      montant: 0,
      description: '',
      dateDepense: new Date(),
      categorie: {
        id: '',
      },
    },
  });

  // Utilisation de la mutation pour créer une dépense
  const { mutate: ajouterDepenseMutation, isPending } = useAjouterDepenseMutation();

  const handleOpenChange = (open: boolean) => {
    reset();
    setSelectedDate(new Date());
    setIsOpen(open);
  };

  const onSubmit = async (data: DepenseCreateDTO) => {
    const formData = {
      ...data,
      dateDepense: selectedDate || new Date(),
      categorie: {
        id: data.categorie.id,
      },
    };

    ajouterDepenseMutation(formData, {
      onSuccess: () => handleOpenChange(false),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus />
          <span className="hidden md:flex">Ajouter une depense</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95%] sm:max-w-[600px] w-full mt-3 sm:mt-3 md:mt-0">
        <DialogHeader>
          <DialogTitle>Ajouter une depense</DialogTitle>
          <DialogDescription>Ajoutez une nouvelle depense</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DepenseForm
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            categories={categories}
            categoriesLoading={categoriesLoading}
            register={register}
            errors={errors}
            setValue={setValue}
          />

          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" className="cursor-pointer" disabled={isSubmitting || isPending}>
              {isSubmitting || isPending ? 'Création en cours...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



