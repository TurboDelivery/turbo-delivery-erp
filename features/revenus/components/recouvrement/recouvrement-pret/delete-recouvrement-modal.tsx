"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { IRecouvrement } from "@/features/revenus/types/recouvrement/recouvrement.types"

interface DeleteRecouvrementModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    recouvrement: IRecouvrement | null
    isLoading?: boolean
}

export function DeleteRecouvrementModal({
    isOpen,
    onClose,
    onConfirm,
    recouvrement,
    isLoading = false
}: DeleteRecouvrementModalProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleConfirm = async () => {
        setIsDeleting(true)
        try {
            await onConfirm()
            onClose()
        } catch (error) {
            // L'erreur est gérée par le hook parent
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Confirmer la suppression
                        </DialogTitle>
                    </div>
                </DialogHeader>
                
                <DialogDescription className="text-gray-600 mt-4">
                    Êtes-vous sûr de vouloir supprimer ce recouvrement ? Cette action est irréversible.
                </DialogDescription>

                {recouvrement && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Restaurant:</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {recouvrement.nomRestaurant}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Montant:</span>
                                <span className="text-sm font-bold text-red-600">
                                    {recouvrement.montant.toLocaleString()} FCFA
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Date:</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {new Date(recouvrement.dateRecouvrement).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-6">
                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isDeleting || isLoading}
                            className="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            disabled={isDeleting || isLoading}
                            className="flex-1"
                        >
                            {isDeleting || isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Suppression...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
