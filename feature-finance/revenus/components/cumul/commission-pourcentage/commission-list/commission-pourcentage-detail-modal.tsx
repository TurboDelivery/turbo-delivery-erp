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
import { Eye, Calendar, Percent, Hash, MapPin, Home } from "lucide-react";
import { ICommission } from "@/feature-finance/revenus/types/commission.types";
import Image from "next/image";
interface CommissionVariableDetailModalProps {
    commissionVariable: ICommission;
}

export function CommissionVariableDetailModal({ commissionVariable }: CommissionVariableDetailModalProps) {
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
                        Détails de la commission fixe <span className="font-bold text-red-500">REF-{commissionVariable.commandeId}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Ligne Référence */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reference" className="text-right flex items-center gap-2">
                            <Hash className="h-4 w-4 text-red-500" />
                            Référence
                        </Label>
                        <Input
                            id="reference"
                            defaultValue={"REF-" + commissionVariable.commandeId}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    {/* Ligne Date */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-red-500" />
                            Date
                        </Label>
                        <Input
                            id="date"
                            defaultValue={new Date().toLocaleDateString()}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    {/* Ligne Livreur */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="livreur" className="text-right flex items-center gap-2">
                            <Home className="h-4 w-4 text-red-500" />
                            Restaurant
                        </Label>
                        <Input
                            id="livreur"
                            defaultValue={commissionVariable.nomRestaurant}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    {/* Ligne Localisation */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="localisation" className=" flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-500" />
                            Localisation
                        </Label>
                        <Input
                            id="coutCommande"
                            defaultValue={`${commissionVariable.localisation}`}
                            className="col-span-3"
                            readOnly
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="montant_commande" className=" flex items-center gap-2">
                            <Percent className="h-4 w-4 text-red-500" />
                            Montant de la commande
                        </Label>
                        <Input
                            id="montant_commande"
                            defaultValue={`${commissionVariable.totalAmount} FCFA`}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    {/* Ligne Commission */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="commission" className=" flex items-center gap-2  text-red-500">
                            <Percent className="h-4 w-4 text-red-500" />
                            Commission
                        </Label>
                        <Input
                            id="commission"
                            defaultValue={`${commissionVariable.commission} FCFA`}
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