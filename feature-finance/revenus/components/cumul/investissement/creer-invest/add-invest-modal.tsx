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
import { useState } from "react"
import { Plus } from "lucide-react"
import { useAjouterInvestissementMutation } from "@/feature-finance/revenus/queries/investissement/investissement.mutation"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { InvestissementCreateDTO, InvestissementCreateSchema } from "@/feature-finance/revenus/schemas/investissement.schema"

export function AddInvestModal() {
    const [selectedDateInvestissement, setSelectedDateInvestissement] = useState<Date | undefined>(undefined)
    const [selectedDeadline, setSelectedDeadline] = useState<Date | undefined>(undefined)
    const [open, setOpen] = useState(false) // État pour contrôler la fermeture du dialogue

    // Configuration du formulaire avec react-hook-form et zod
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
    } = useForm<InvestissementCreateDTO>({
        resolver: zodResolver(InvestissementCreateSchema),
        defaultValues: {
            nomInvestisseur: '',
            montant: 0,
            dateInvestissement: '',
            deadline: '',
        },
    })

    // Utilisation de la mutation pour créer un investissement
    const ajouterInvestissementMutation = useAjouterInvestissementMutation()

    // Réinitialiser aussi les états des dates
    const resetForm = () => {
        reset()
        setSelectedDateInvestissement(undefined)
        setSelectedDeadline(undefined)
    }

    // Gestion de la soumission du formulaire
    const onSubmit = async (data: InvestissementCreateDTO) => {
        console.log("onSubmit appelé avec les données:", data)
        try {
            const formData = {
                nomInvestisseur: data.nomInvestisseur,
                montant: data.montant,
                dateInvestissement: data.dateInvestissement,
                deadline: data.deadline,
            }

            await ajouterInvestissementMutation.mutateAsync(formData)

            // Réinitialiser le formulaire et fermer le dialogue
            resetForm()
            setOpen(false) // Fermer le dialogue après succès

            // Afficher un toast de succès
            toast.success("Investissement ajouté avec succès", {
                description: `L'investissement "${formData.dateInvestissement}" a été ajouté avec succès`,
                duration: 4000,
            })

        } catch (error) {
            console.error("Erreur lors de la création de l'investissement:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>

            <DialogTrigger asChild>
                <Button
                    variant="default"
                    className="w-[240px] cursor-pointer  gap-1 md:gap-2 bg-amber-500 text-white hover:bg-amber-600 hover:text-white"
                >
                    <Plus />Ajouter <span className="hidden md:flex"> une investissement</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95%] sm:max-w-[600px] w-full mt-3 sm:mt-3 md:mt-0">
                <DialogHeader>
                    <DialogTitle>Ajouter une investissement</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>

                    <div className="grid gap-6">
                        {/* Date et heure */}
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="dateInvestissement" className="text-sm text-gray-500">
                                    Date de l'investissement
                                </Label>
                                <Input
                                    type="date"
                                    {...register('dateInvestissement')}
                                    className="w-full"
                                    onChange={(e) => {
                                        const value = e.target.value
                                        setValue('dateInvestissement', value)
                                        if (value) {
                                            setSelectedDateInvestissement(new Date(value))
                                        } else {
                                            setSelectedDateInvestissement(undefined)
                                        }
                                    }}
                                />
                                {errors.dateInvestissement && (
                                    <p className="text-red-500 text-sm">{errors.dateInvestissement.message}</p>
                                )}
                            </div>
                        </div>
                        {/* Équipe adverse */}
                        <div className="grid gap-3">
                            <Label htmlFor="investisseur" className="text-sm text-gray-500">
                                Nom de l'investisseur
                            </Label>
                            <div className="grid gap-3">
                                <Label htmlFor="nomInvestisseur" className="text-sm text-gray-500">
                                    Nom de l'investisseur
                                </Label>
                                <Input
                                    id="nomInvestisseur"
                                    placeholder="Nom de l'investisseur"
                                    type="text"
                                    {...register('nomInvestisseur')}
                                />
                                {errors.nomInvestisseur && (
                                    <p className="text-red-500 text-sm">{errors.nomInvestisseur.message}</p>
                                )}
                            </div>                        </div>

                        {/* Montant */}
                        <div className="grid gap-3">
                            <div className="grid gap-3">
                                <Label htmlFor="montant" className="text-sm text-gray-500">
                                    Montant de l'investissement
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
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="deadline" className="text-sm text-gray-500">
                                    Echéance
                                </Label>
                                <Input
                                    type="date"
                                    {...register('deadline')}
                                    className="w-full"
                                    onChange={(e) => {
                                        const value = e.target.value
                                        setValue('deadline', value)
                                        if (value) {
                                            setSelectedDeadline(new Date(value))
                                        } else {
                                            setSelectedDeadline(undefined)
                                        }
                                    }}
                                />
                                {errors.deadline && (
                                    <p className="text-red-500 text-sm">{errors.deadline.message}</p>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className="rounded-full w-full sm:w-auto cursor-pointer"
                                onClick={() => resetForm()}
                            >
                                Annuler
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            className="cursor-pointer bg-amber-500 hover:bg-amber-600 rounded-full w-full sm:w-auto px-10"
                            disabled={isSubmitting || ajouterInvestissementMutation.isPending}
                        >
                            {isSubmitting || ajouterInvestissementMutation.isPending ? 'Création en cours...' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>

        </Dialog >
    )
}
