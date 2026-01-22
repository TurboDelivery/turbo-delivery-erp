"use client";

import { useCallback } from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ICategorieDepense } from "../../types/categorie-depense.type";
import { useSupprimerCategorieDepenseMutation } from "../../queries/category/categorie-depense-mutation.query";
import { Trash } from "lucide-react";

type Props = {
    categorieDepense: ICategorieDepense | null;
};

export default function SupprimerCategorieModal({
    categorieDepense,
}: Props) {
    const { mutateAsync: supprimerCategorieDepenseMutation, isPending } =
        useSupprimerCategorieDepenseMutation();

    const handleDelete = useCallback(async () => {
        try {
            await supprimerCategorieDepenseMutation(categorieDepense?.id || "");
            toast.success("Catégorie et toutes ses dépenses supprimées avec succès.");
        } catch (error) {
            toast.error("Erreur lors de la suppression de la catégorie", {
                description:
                    error instanceof Error ? error.message : "Une erreur est survenue",
            });
        }
    }, [supprimerCategorieDepenseMutation, categorieDepense]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 cursor-pointer hover:text-blue-800 transition-colors">
                    <Trash className="h-5 w-5 text-red-500" />
                    <span className="hidden md:flex text-sm font-medium">Supprimer</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {`Supprimer ${categorieDepense?.nomCategorie} ?`}
                    </DialogTitle>
                    <DialogDescription>
                        Êtes-vous sûr de vouloir supprimer cette catégorie ?
                        <br />
                        <strong className="text-red-500">
                            Cette action supprimera automatiquement toutes les dépenses associées à cette catégorie.
                        </strong>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 sm:justify-end">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            disabled={isPending}
                        >
                            Annuler
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={handleDelete}
                        disabled={isPending}
                    >
                        {isPending ? "Suppression..." : "Supprimer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}