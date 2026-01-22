"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"
import { ajouterDepenseAction } from "../../actions/depense.action"
import { DepenseCreateSchema } from "../../schemas/depense.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { DepenseCreateDTO } from "../../schemas/depense.schema"
import { IDepense } from "../../types/depense.type"
import { Plus } from "lucide-react"
import { useAjouterDepenseMutation } from "../../queries/depense.mutation"
import { useCategorieDepensesListQuery } from "../../queries/category/categorie-depense.query"
import { ICategorieDepense } from "../../types/categorie-depense.type"
import { CalendarInput } from "@/components/components-finance/block/dateInput"

interface DepensesProps {
    depenses: IDepense[];   
}

export function CreerDepenseModal({ depenses }: DepensesProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [isOpen, setIsOpen] = useState(false)
    
    // Récupération des catégories actives
    const { data: categories, isLoading: categoriesLoading } = useCategorieDepensesListQuery({ params: {} })
    

    // Configuration du formulaire avec react-hook-form et zod
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
            libelle: '',
            montant: 0,
            description: '',
            dateDepense: '',
            categorie: {
                id: ''
            }
        },
    })

    // Utilisation de la mutation pour créer une dépense
    const ajouterDepenseMutation = useAjouterDepenseMutation()  

    // Gestion de la soumission du formulaire
    const onSubmit = async (data: DepenseCreateDTO) => {
        try {
            // Formater la date si elle est sélectionnée
            const formData = {
                ...data,
                dateDepense: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                // S'assurer que categorie est un objet avec id
                categorie: {
                    id: data.categorie.id
                }
            }

            console.log("Données envoyées:", formData);

            const result = await ajouterDepenseAction(formData)
            
            if (result.success) {
                toast.success("Dépense créée avec succès!")
                reset()
                setSelectedDate(undefined)
                setIsOpen(false)
                // Rafraîchir la liste des dépenses
                window.location.reload()
            } else {
                toast.error(result.error || "Erreur lors de la création de la dépense")
            }
        } catch (error) {
            console.error("Erreur complète:", error);
            toast.error("Une erreur est survenue lors de la création de la dépense")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    className="cursor-pointer flex items-center gap-1 md:gap-2 bg-amber-500 text-white hover:bg-amber-600 hover:text-white"
                >
                    <Plus />Ajouter <span className="hidden md:flex"> une depense</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95%] sm:max-w-[600px] w-full mt-3 sm:mt-3 md:mt-0">
                <DialogHeader>
                    <DialogTitle>Ajouter une depense</DialogTitle>
                    <DialogDescription>
                        Ajoutez une nouvelle depense
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-6">
                        {/* Libelle */}
                        <div className="grid gap-3">
                            <Label htmlFor="libelle" className="text-sm text-gray-500">
                                Libelle *
                            </Label>
                            <Input 
                                id="libelle" 
                                placeholder="Libelle de la dépense"
                                {...register('libelle')}
                            />
                            {errors.libelle && (
                                <p className="text-red-500 text-sm">{errors.libelle.message}</p>
                            )}
                        </div>

                        {/* Date et catégorie */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="dateDepense" className="text-sm text-gray-500">
                                    Date de la depense *
                                </Label>
                                <CalendarInput
                                    value={selectedDate}
                                    onChange={(date) => {
                                        setSelectedDate(date)
                                        if (date) {
                                            setValue('dateDepense', date.toISOString().split('T')[0])
                                        }
                                    }}
                                    placeholder="Sélectionnez une date"
                                />
                                {errors.dateDepense && (
                                    <p className="text-red-500 text-sm">{errors.dateDepense.message}</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="categorie.id" className="text-sm text-gray-500">
                                    Catégorie de dépenses *
                                </Label>
                                <Select 
                                    onValueChange={(value) => setValue('categorie.id', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Sélectionnez une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Catégories</SelectLabel>
                                            {categoriesLoading ? (
                                                <SelectItem value="loading" disabled>Chargement...</SelectItem>
                                            ) : categories && categories.length > 0 ? (
                                                categories.map((categorie: ICategorieDepense) => (
                                                    <SelectItem key={categorie.id} value={categorie.id}>
                                                        {categorie.nomCategorie}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>Aucune catégorie disponible</SelectItem>
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {errors.categorie?.id && (
                                    <p className="text-red-500 text-sm">{errors.categorie.id.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Montant */}
                        <div className="grid gap-3">
                            <Label htmlFor="montant" className="text-sm text-gray-500">
                                Montant de la depense *
                            </Label>
                            <Input 
                                id="montant" 
                                placeholder="Montant" 
                                type="number" 
                                step="0.01"
                                {...register('montant', { valueAsNumber: true })}
                            />
                            {errors.montant && (
                                <p className="text-red-500 text-sm">{errors.montant.message}</p>
                            )}
                        </div>

                        {/* Description (optionnelle) */}
                        <div className="grid gap-3">
                            <Label htmlFor="description" className="text-sm text-gray-500">
                                Description
                            </Label>
                            <Input 
                                id="description" 
                                placeholder="Description (optionnelle)"
                                {...register('description')}
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm">{errors.description.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
                        <DialogClose asChild>
                            <Button 
                                variant="outline" 
                                className="cursor-pointer rounded-full w-full sm:w-auto"
                                type="button"
                            >
                                Annuler
                            </Button>
                        </DialogClose>
                        <Button 
                            type="submit" 
                            className="cursor-pointer bg-amber-500 hover:bg-amber-600 rounded-full w-full sm:w-auto px-10"
                            disabled={isSubmitting || ajouterDepenseMutation.isPending}
                        >
                            {isSubmitting || ajouterDepenseMutation.isPending ? 'Création en cours...' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}