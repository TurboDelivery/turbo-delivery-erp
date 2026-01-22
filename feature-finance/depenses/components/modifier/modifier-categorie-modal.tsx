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
import { useState,  } from "react"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ICategorieDepense } from "../../types/categorie-depense.type"
import { CategorieDepenseUpdateDTO, CategorieDepenseUpdateSchema } from "../../schemas/categorie-depense.schema"
import { useModifierCategorieDepenseMutation } from "../../queries/category/categorie-depense-mutation.query"

interface ModdifierDepenseModalProps {
    categorieDepense: ICategorieDepense;
}

export function ModifierCategorieModal({ categorieDepense }: ModdifierDepenseModalProps) {
 
    const [open, setOpen] = useState(false)

    // Configuration du formulaire avec react-hook-form et zod
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<CategorieDepenseUpdateDTO>({
        resolver: zodResolver(CategorieDepenseUpdateSchema),
        defaultValues: {
            nomCategorie: categorieDepense.nomCategorie,
            description: categorieDepense.description,
        },
    })

 

    // Utilisation de la mutation pour MODIFIER un investissement (à créer)
    const modifierCategorieDepenseMutation = useModifierCategorieDepenseMutation()

    // Gestion de la soumission du formulaire
    const onSubmit = async (data: CategorieDepenseUpdateDTO) => {
        try {
            const formData = {
                nomCategorie: data.nomCategorie,
                description: data.description,
            }

            await modifierCategorieDepenseMutation.mutateAsync({
                id: categorieDepense.id,
                data: formData,
            })

            // Réinitialiser le formulaire et fermer le dialogue
            reset()
            setOpen(false)

            // Afficher un toast de succès
            toast.success("Categorie modifiée avec succès", {
                description: `La categorie de "${formData.nomCategorie}" a été modifiée avec succès`,
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
        <Dialog>
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
                        Modifiez les informations de la depense de {categorieDepense.nomCategorie}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-6">
                        {/* nom de la categorie */}
                        <div className="grid gap-3">
                            <Label htmlFor="nomCategorie" className="text-sm text-gray-500">
                                Nom de la categorie
                            </Label>
                            <Input
                                id="nomCategorie"
                                placeholder="Nom de la categorie"
                                type="text"
                                {...register('nomCategorie')}
                            />
                            {errors.nomCategorie && (
                                <p className="text-red-500 text-sm">{errors.nomCategorie.message}</p>
                            )}
                        </div>

                        {/* description */}
                        <div className="grid gap-3">
                            <Label htmlFor="description" className="text-sm text-gray-500">
                                Description
                            </Label>
                            <Input
                                id="description"
                                placeholder="Description"
                                type="text"
                                {...register('description')}
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm">{errors.description.message}</p>
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
                            disabled={isSubmitting || modifierCategorieDepenseMutation.isPending}
                        >
                            {isSubmitting || modifierCategorieDepenseMutation.isPending ? 'Modification...' : 'Modifier'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}