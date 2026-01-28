'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { DepenseCreateDTO, DepenseCreateSchema } from '../../schemas/depense.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { useAjouterDepenseMutation } from '../../queries/depense.mutation';
import { useCategorieDepensesListQuery } from '../../queries/category/categorie-depense.query';
import { ICategorieDepense } from '../../types/categorie-depense.type';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { fr } from 'date-fns/locale';

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
    watch,
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
          <div className="grid gap-6">
            {/* Date et catégorie */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="dateDepense" className="text-sm text-gray-500">
                  Date de la depense *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" data-empty={!selectedDate} className="data-[empty=true]:text-muted-foreground w-[212px] justify-between text-left font-normal">
                      {selectedDate ? format(selectedDate, 'PPP', { locale: fr }) : <span>Choisissez une date</span>}
                      <CalendarIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} defaultMonth={selectedDate} />
                  </PopoverContent>
                </Popover>
                {errors.dateDepense && <p className="text-red-500 text-sm">{errors.dateDepense.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="montant" className="text-sm text-gray-500">
                  Montant de la depense *
                </Label>
                <Input id="montant" placeholder="Montant" type="number" step="0.01" {...register('montant', { valueAsNumber: true })} />
                {errors.montant && <p className="text-red-500 text-sm">{errors.montant.message}</p>}
              </div>
            </div>

            {/* Montant */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="categorie.id" className="text-sm text-gray-500">
                Catégorie de dépenses *
              </Label>
              <Select onValueChange={(value) => setValue('categorie.id', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Catégories</SelectLabel>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>
                        Chargement...
                      </SelectItem>
                    ) : categories && categories.length > 0 ? (
                      categories.map((categorie: ICategorieDepense) => (
                        <SelectItem key={categorie.id} value={categorie.id}>
                          {categorie.nomCategorie}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        Aucune catégorie disponible
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.categorie?.id && <p className="text-red-500 text-sm">{errors.categorie.id.message}</p>}
            </div>

            {/* Description */}
            <div className="grid gap-3">
              <Label htmlFor="description" className="text-sm text-gray-500">
                Description *
              </Label>
              <Textarea id="description" placeholder="Description" {...register('description')} />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>
          </div>

          {/* Footer */}
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
