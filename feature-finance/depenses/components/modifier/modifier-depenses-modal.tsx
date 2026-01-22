"use client"
import { CalendarInput } from "@/components/components-finance/block/dateInput"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IDepense } from "../../types/depense.type"
import { DepenseUpdateDTO, DepenseUpdateSchema } from "../../schemas/depense.schema"
import { useModifierDepenseMutation } from "../../queries/depense.mutation"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ICategorieDepense } from "../../types/categorie-depense.type"
import { useCategorieDepensesListQuery } from "../../queries/category/categorie-depense.query"

interface ModdifierDepenseModalProps {
    depenses: IDepense;
}

export function ModifierDepenseModal({ depenses }: ModdifierDepenseModalProps) {
    const [dateDepense, setDateDepense] = useState<Date | undefined>(
        depenses.dateDepense ? new Date(depenses.dateDepense) : undefined
    )
    const [open, setOpen] = useState(false)
    const { data: categories, isLoading: categoriesLoading } = useCategorieDepensesListQuery({ params: {} })

    // Configuration du formulaire avec react-hook-form et zod
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm<DepenseUpdateDTO>({
        resolver: zodResolver(DepenseUpdateSchema),
        defaultValues: {
            libelle: depenses.libelle,
            montant: depenses.montant,
            dateDepense: depenses.dateDepense,
            description: depenses.description,
            categorie: depenses.categorie,
        },
    })

    // Synchroniser les dates avec le form
    useEffect(() => {
        if (depenses.dateDepense) {
            setDateDepense(new Date(depenses.dateDepense))
        }
    }, [depenses])

    // Utilisation de la mutation pour MODIFIER un investissement (à créer)
    const modifierDepenseMutation = useModifierDepenseMutation()

    // Gestion de la soumission du formulaire
    const onSubmit = async (data: DepenseUpdateDTO) => {
        try {
            const formData = {
                libelle: data.libelle,
                montant: data.montant,
                dateDepense: data.dateDepense,
                description: data.description,
                categorie: data.categorie,
            }

            await modifierDepenseMutation.mutateAsync({
                id: depenses.id,
                data: formData,
            })

            // Réinitialiser le formulaire et fermer le dialogue
            reset()
            setOpen(false)

            // Afficher un toast de succès
            toast.success("Depense modifiée avec succès", {
                description: `La depense de "${formData.libelle}" a été modifiée avec succès`,
                duration: 4000,
            })

        } catch (error) {
            console.error("Erreur lors de la modification de l'investissement:", error)
            toast.error("Erreur lors de la modification", {
                description: "Une erreur s'est produite lors de la modification",
                duration: 4000,
            })
        }
    }

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
                    <DialogTitle>Modifier un investissement</DialogTitle>
                    <DialogDescription>
                        Modifiez les informations de la depense de {depenses.libelle}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-6">
                        {/* Date d'investissement */}
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="dateDepense" className="text-sm text-gray-500">
                                    Date de la depense
                                </Label>
                                <CalendarInput
                                    value={dateDepense}
                                    onChange={(date) => {
                                        setDateDepense(date)
                                        if (date) {
                                            setValue('dateDepense', date.toISOString().split('T')[0], {
                                                shouldValidate: true
                                            })
                                        }
                                    }}
                                    placeholder="Sélectionnez une date"
                                />
                                {errors.dateDepense && (
                                    <p className="text-red-500 text-sm">{errors.dateDepense.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Libelle */}
                        <div className="grid gap-3">
                            <Label htmlFor="libelle" className="text-sm text-gray-500">
                                Libelle
                            </Label>
                            <Input
                                id="libelle"
                                placeholder="Libelle"
                                type="text"
                                {...register('libelle')}
                            />
                            {errors.libelle && (
                                <p className="text-red-500 text-sm">{errors.libelle.message}</p>
                            )}
                        </div>

                        {/* Montant */}
                        <div className="grid gap-3">
                            <Label htmlFor="montant" className="text-sm text-gray-500">
                                Montant de la depense
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

                    {/* Footer */}
                    <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className="rounded-full w-full sm:w-auto cursor-pointer"
                                type="button"
                            >
                                Annuler
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            className="cursor-pointer bg-amber-500 hover:bg-amber-600 rounded-full w-full sm:w-auto px-10"
                            disabled={isSubmitting || modifierDepenseMutation.isPending}
                        >
                            {isSubmitting || modifierDepenseMutation.isPending ? 'Modification...' : 'Modifier'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}