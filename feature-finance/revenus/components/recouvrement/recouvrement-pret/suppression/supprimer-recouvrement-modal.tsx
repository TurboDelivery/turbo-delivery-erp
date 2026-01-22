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
import { Trash } from "lucide-react";
import { IRecouvrement } from "@/feature-finance/revenus/types/recouvrement/recouvrement.types";
import { useSupprimerRecouvrementMutation } from "@/feature-finance/revenus/queries/recouvrement/recouvrement.mutation";

type Props = {
    recouvrement: IRecouvrement | null;
};

export default function SupprimerDepenseModal({
    recouvrement,
}: Props) {
    const { mutateAsync: supprimerRecouvrementMutation, isPending } =
        useSupprimerRecouvrementMutation();

    const handleDelete = useCallback(async () => {
        try {
            await supprimerRecouvrementMutation(recouvrement?.id || "");
            toast.success("Recouvrement supprimé avec succès.");
        } catch (error) {
            toast.error("Erreur lors de la suppression du recouvrement", {
                description:
                    error instanceof Error ? error.message : "Une erreur est survenue",
            });
        }
    }, [supprimerRecouvrementMutation, recouvrement]);

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
                        {`Supprimer recouvrement de ${recouvrement?.nomRestaurant} ?`}
                    </DialogTitle>
                    <DialogDescription>
                        Êtes-vous sûr de vouloir supprimer ce recouvrement ?
                        <br />
                        <strong className="text-red-500">
                            Cette action est irréversible.
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