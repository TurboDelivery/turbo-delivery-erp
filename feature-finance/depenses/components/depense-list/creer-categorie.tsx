"use client"
import { CalendarInput } from "@/components/block/dateInput"
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
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CategorieDepenseCreateDTO } from "../../schemas/categorie-depense.schema"
import { CategorieDepenseCreateSchema } from "../../schemas/categorie-depense.schema"
import { useAjouterCategorieDepenseMutation } from "../../queries/category/categorie-depense-mutation.query"
import { useState } from "react" // Import ajouté
import { toast } from "sonner"

export function CreerCategorieModal() {
    const [open, setOpen] = useState(false) // État pour contrôler la fermeture du dialogue
    
    // Configuration du formulaire avec react-hook-form et zod
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
    } = useForm<CategorieDepenseCreateDTO>({
        resolver: zodResolver(CategorieDepenseCreateSchema),
        defaultValues: {
            nomCategorie: '',
            description: '',
        },
    })
    
    // Utilisation de la mutation pour créer une dépense
    const ajouterCategorieDepenseMutation = useAjouterCategorieDepenseMutation()

    // Gestion de la soumission du formulaire
    const onSubmit = async (data: CategorieDepenseCreateDTO) => {
        console.log("onSubmit appelé avec les données:", data)
        try {
            const formData = {
                nomCategorie: data.nomCategorie,
                description: data.description,
            }

            await ajouterCategorieDepenseMutation.mutateAsync(formData)
          
            // Réinitialiser le formulaire et fermer le dialogue
            reset()
            setOpen(false) // Fermer le dialogue après succès
            
            // Afficher un toast de succès
            toast.success("Catégorie créée avec succès", {
                description: `La catégorie "${formData.nomCategorie}" a été ajoutée avec succès`,
                duration: 4000,
            })
            
        } catch (error) {
            console.error("Erreur lors de la création de la dépense:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 md:gap-2"
                >
                    <Plus />Ajouter <span className="hidden md:flex"> une categorie</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95%] sm:max-w-[600px] w-full mt-3 sm:mt-3 md:mt-0">
                <DialogHeader>
                    <DialogTitle>Ajouter une categorie</DialogTitle>
                    <DialogDescription>
                        Ajoutez une nouvelle categorie
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-6">
                        {/* Nom de la catégorie */}
                        <div className="grid gap-3">
                            <Label htmlFor="nomCategorie" className="text-sm text-gray-500">
                                Nom
                            </Label>
                            <Input 
                                id="nomCategorie" 
                                {...register('nomCategorie')}
                                placeholder="Nom de la catégorie" 
                            />
                            {errors.nomCategorie && (
                                <p className="text-red-500 text-sm">{errors.nomCategorie.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="grid gap-3">
                            <Label htmlFor="description" className="text-sm text-gray-500">
                                Description
                            </Label>
                            <Input 
                                id="description" 
                                {...register('description')}
                                placeholder="Description" 
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
                                type="button"
                                variant="outline"
                                className="rounded-full w-full sm:w-auto cursor-pointer"
                            >
                                Annuler
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            className="cursor-pointer bg-amber-500 hover:bg-amber-600"
                            disabled={isSubmitting || ajouterCategorieDepenseMutation.isPending}
                        >
                            {isSubmitting || ajouterCategorieDepenseMutation.isPending ? 'Création en cours...' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}