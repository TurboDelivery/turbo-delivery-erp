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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Edit } from "lucide-react"
import { useModifierInvestissementMutation } from "@/feature-finance/revenus/queries/investissement/investissement.mutation" // À créer
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { InvestissementUpdateDTO, InvestissementUpdateSchema } from "@/feature-finance/revenus/schemas/investissement.schema"
import { IInvestissement } from "@/feature-finance/revenus/types/revenus.types"

interface ModifierInvestModalProps {
    investissement: IInvestissement;
}

export function ModifierInvestModal({ investissement }: ModifierInvestModalProps) {
    const [dateInvestissement, setDateInvestissement] = useState<Date | undefined>(
        investissement.dateInvestissement ? new Date(investissement.dateInvestissement) : undefined
    )
    const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
        investissement.deadline ? new Date(investissement.deadline) : undefined
    )
    const [open, setOpen] = useState(false)

    // Configuration du formulaire avec react-hook-form et zod
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm<InvestissementUpdateDTO>({
        resolver: zodResolver(InvestissementUpdateSchema),
        defaultValues: {
            nomInvestisseur: investissement.nomInvestisseur,
            montant: investissement.montant,
            dateInvestissement: investissement.dateInvestissement,
            deadline: investissement.deadline,
        },
    })

    // Synchroniser les dates avec le form
    useEffect(() => {
        if (investissement.dateInvestissement) {
            setDateInvestissement(new Date(investissement.dateInvestissement))
        }
        if (investissement.deadline) {
            setDeadlineDate(new Date(investissement.deadline))
        }
    }, [investissement])

    // Utilisation de la mutation pour MODIFIER un investissement (à créer)
    const modifierInvestissementMutation = useModifierInvestissementMutation()

    // Gestion de la soumission du formulaire
    const onSubmit = async (data: InvestissementUpdateDTO) => {
        try {
            const formData = {
                nomInvestisseur: data.nomInvestisseur,
                montant: data.montant,
                dateInvestissement: data.dateInvestissement,
                deadline: data.deadline,
            }

            await modifierInvestissementMutation.mutateAsync({
                id: investissement.id,
                data: formData,
            })

            // Réinitialiser le formulaire et fermer le dialogue
            reset()
            setOpen(false)

            // Afficher un toast de succès
            toast.success("Investissement modifié avec succès", {
                description: `L'investissement de "${formData.nomInvestisseur}" a été modifié avec succès`,
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
                        Modifiez les informations de l'investissement de {investissement.nomInvestisseur}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-6">
                        {/* Date d'investissement */}
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="dateInvestissement" className="text-sm text-gray-500">
                                    Date de l'investissement
                                </Label>
                                <Input
                                    type="date"
                                    {...register('dateInvestissement')}
                                    className="w-full"
                                    defaultValue={investissement.dateInvestissement}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        setValue('dateInvestissement', value, { shouldValidate: true })
                                        if (value) {
                                            setDateInvestissement(new Date(value))
                                        } else {
                                            setDateInvestissement(undefined)
                                        }
                                    }}
                                />
                                {errors.dateInvestissement && (
                                    <p className="text-red-500 text-sm">{errors.dateInvestissement.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Nom de l'investisseur */}
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
                        </div>

                        {/* Montant */}
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

                        {/* Échéance */}
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="deadline" className="text-sm text-gray-500">
                                    Échéance
                                </Label>
                                <Input
                                    type="date"
                                    {...register('deadline')}
                                    className="w-full"
                                    defaultValue={investissement.deadline}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        setValue('deadline', value, { shouldValidate: true })
                                        if (value) {
                                            setDeadlineDate(new Date(value))
                                        } else {
                                            setDeadlineDate(undefined)
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
                                type="button"
                            >
                                Annuler
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            className="cursor-pointer bg-amber-500 hover:bg-amber-600 rounded-full w-full sm:w-auto px-10"
                            disabled={isSubmitting || modifierInvestissementMutation.isPending}
                        >
                            {isSubmitting || modifierInvestissementMutation.isPending ? 'Modification...' : 'Modifier'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}