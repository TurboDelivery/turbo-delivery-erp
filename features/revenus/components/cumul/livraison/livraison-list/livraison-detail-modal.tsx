"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Calendar, User, DollarSign, Percent, Hash } from "lucide-react";
import { ILivraison } from "@/features/revenus/types/livraison.types";
import Image from "next/image";
interface LivraisonDetailModalProps {
    livraison: ILivraison;
}

export function LivraisonDetailModal({ livraison }: LivraisonDetailModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 cursor-pointer hover:text-blue-800 transition-colors">
                    <Eye className="h-5 w-5 text-red-500" />
                    <span className="hidden md:flex text-sm font-medium">Voir détails</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 ">
                        <Image
                            src="/assets/images/logo_turbo.jpg"
                            alt="logo_turbo"
                            width={50}
                            height={50}
                            className="rounded-lg"
                        />
                        Détails de la livraison <span className="font-bold text-red-500">REF-{livraison.refCommande}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Ligne Référence */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reference" className="text-right flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Référence
                        </Label>
                        <Input
                            id="reference"
                            defaultValue={"REF-" + livraison.refCommande}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    {/* Ligne Date */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date
                        </Label>
                        <Input
                            id="date"
                            defaultValue={livraison.createdAt}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    {/* Ligne Livreur */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="livreur" className="text-right flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Livreur
                        </Label>
                        <Input
                            id="livreur"
                            defaultValue={livraison.nomLivreur}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                 

                    {/* Ligne Coût Commande */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="coutCommande" className=" flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Coût commande
                        </Label>
                        <Input
                            id="coutCommande"
                            defaultValue={`${livraison.totalAmount} FCFA`}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    {/* Ligne Commission */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="commission" className=" flex items-center gap-2 text-red-500">
                            <Percent className="h-4 w-4" />
                            Commission
                        </Label>
                        <Input
                            id="commission"
                            defaultValue={`${livraison.commission} FCFA`}
                            className="col-span-3 text-red-500"
                            readOnly
                        />
                    </div>


                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" className="cursor-pointer">Fermer</Button>
                    </DialogClose>
                    <Button type="button" onClick={() => window.print()} variant="destructive" className="cursor-pointer">
                        Imprimer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}