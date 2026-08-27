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
import { Eye, Calendar, User, DollarSign, Hash, Bookmark } from "lucide-react";
import { ICategorieDepense } from "@/features/depenses/types/categorie-depense.type";
import Image from "next/image";
import { formatMontant } from '@/utils/format.utils';
interface CategorieDetailModalProps {
    categorie: ICategorieDepense;
}

export function CategorieDetailModal({ categorie }: CategorieDetailModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 cursor-pointer hover:text-blue-800 transition-colors">
                    <Eye className="h-5 w-5 text-blue-500" />
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
                        Détails de la catégorie <span className="font-bold text-red-500">REF-{categorie.id}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Ligne Référence */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reference" className="text-right flex items-center text-sm gap-2">
                            <Hash className="h-4 w-4" />
                            Référence
                        </Label>
                        <Input
                            id="reference"
                            defaultValue={"REF-" + categorie.id}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date
                        </Label>
                        <Input
                            id="date"
                            defaultValue={categorie.createdAt}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nom" className="text-right flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Nom
                        </Label>
                        <Input
                            id="nom"
                            defaultValue={categorie.nomCategorie}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className=" flex items-center gap-2">
                            <Bookmark className="h-4 w-4" />
                            Description
                        </Label>
                        <Input
                            id="description"
                            defaultValue={`${categorie.description}`}
                            className="col-span-3"
                            readOnly
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="montant" className=" flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Montant total
                        </Label>
                        <Input
                            id="montant"
                            defaultValue={formatMontant(categorie.totalDepense)}
                            className="col-span-3"
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