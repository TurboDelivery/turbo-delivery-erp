'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { ChevronDownIcon, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IDepense } from '../../types/depense.type';
import { DepenseUpdateDTO, DepenseUpdateSchema } from '../../schemas/depense.schema';
import { useModifierDepenseMutation } from '../../queries/depense.mutation';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ICategorieDepense } from '../../types/categorie-depense.type';
import { useCategorieDepensesListQuery } from '../../queries/category/categorie-depense.query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';

interface ModifierDepenseModalProps {
  depenses: IDepense;
}

export function ModifierDepenseModal({ depenses }: ModifierDepenseModalProps) {
  const [dateDepense, setDateDepense] = useState<Date | undefined>(depenses.dateDepense ? new Date(depenses.dateDepense) : new Date());
  const [open, setOpen] = useState(false);
  const { data: categories, isLoading: categoriesLoading } = useCategorieDepensesListQuery({ params: {} });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<DepenseUpdateDTO>({
    resolver: zodResolver(DepenseUpdateSchema),
    values: {
      libelle: depenses.libelle,
      montant: depenses.montant,
      dateDepense: depenses.dateDepense,
      description: depenses.description,
      categorie: depenses.categorie,
    },
  });

  // Synchroniser les dates avec le form
  useEffect(() => {
    if (depenses.dateDepense) {
      setDateDepense(new Date(depenses.dateDepense));
    }
  }, [depenses]);

  // Utilisation de la mutation pour MODIFIER un investissement (à créer)
  const modifierDepenseMutation = useModifierDepenseMutation();

  // Gestion de la soumission du formulaire
  const onSubmit = async (data: DepenseUpdateDTO) => {
    try {
      const formData = {
        description: data.description,
        montant: data.montant,
        dateDepense: data.dateDepense,
        categorie: data.categorie,
      };

      await modifierDepenseMutation.mutateAsync({
        id: depenses.id,
        data: formData,
      });

      // Réinitialiser le formulaire et fermer le dialogue
      reset();
      setOpen(false);

      // Afficher un toast de succès
      toast.success('Depense modifiée avec succès', {
        description: `La depense de "${formData.dateDepense}" a été modifiée avec succès`,
        duration: 4000,
      });
    } catch (error) {
      console.error("Erreur lors de la modification de l'investissement:", error);
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
          <div className="grid grid-cols-2 gap-6">
            {/* Date d'investissement */}
            <div>
              <Label htmlFor="dateDepense" className="text-sm text-gray-500">
                Date de la depense
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" data-empty={!dateDepense} className="data-[empty=true]:text-muted-foreground w-full justify-between text-left font-normal">
                    {dateDepense ? format(dateDepense, 'PPP', { locale: fr }) : <span>Choisissez une date</span>}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateDepense} onSelect={setDateDepense} defaultMonth={dateDepense} />
                </PopoverContent>
              </Popover>
              {errors.dateDepense && <p className="text-red-500 text-sm">{errors.dateDepense.message}</p>}
            </div>

            {/* Montant */}
            <div>
              <Label htmlFor="montant" className="text-sm text-gray-500">
                Montant de la depense
              </Label>
              <Input id="montant" placeholder="Montant" type="number" step="1" {...register('montant', { valueAsNumber: true })} />
              {errors.montant && <p className="text-red-500 text-sm">{errors.montant.message}</p>}
            </div>

            {/* Catégorie de dépense */}
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
            <div className="col-span-full">
              <Label htmlFor="description" className="text-sm text-gray-500">
                Description
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
            <Button type="submit" disabled={isSubmitting || modifierDepenseMutation.isPending}>
              {isSubmitting || modifierDepenseMutation.isPending ? 'Modification...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
