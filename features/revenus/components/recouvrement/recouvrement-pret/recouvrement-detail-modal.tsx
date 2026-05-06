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
import { IRecouvrement } from "@/features/revenus/types/recouvrement/recouvrement.types";
import { getFullUrlFile } from "@/utils/getFullUrlFile";
import { Eye, Calendar, User, DollarSign, Hash, Building } from "lucide-react";
import Image from "next/image";
interface RecouvrementDetailModalProps {
  recouvrement: IRecouvrement;
}

export function RecouvrementDetailModal({
  recouvrement,
}: RecouvrementDetailModalProps) {
  const montantAffiche = isNaN(recouvrement.montant)
    ? "0 FCFA"
    : `${recouvrement.montant.toLocaleString("fr-FR")} FCFA`;



  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 cursor-pointer hover:text-blue-800 transition-colors">
          <Eye className="h-5 w-5 text-red-500" />
          <span className="hidden md:flex text-sm font-medium">
            Voir détails
          </span>
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
            Détails du recouvrement{" "}
            <span className="font-bold text-red-500">
              REF-{recouvrement.id.slice(0, 8)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Référence */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reference" className="text-right flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Référence
            </Label>
            <Input
              id="reference"
              value={"REF-" + recouvrement.id.slice(0, 8).toUpperCase()}
              className="col-span-3"
              readOnly
            />
          </div>

          {/* Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <Input
              id="date"
              value={new Date(recouvrement.dateRecouvrement).toLocaleDateString("fr-FR")}
              className="col-span-3"
              readOnly
            />
          </div>

          {/* Restaurant */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="restaurant" className="text-right flex items-center gap-2">
              <Building className="h-4 w-4" />
              Restaurant
            </Label>
            <Input
              id="restaurant"
              value={recouvrement.nomRestaurant}
              className="col-span-3"
              readOnly
            />
          </div>

          {/* ID Restaurant */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="restaurantId" className="text-right flex items-center gap-2">
              <User className="h-4 w-4" />
              ID Restaurant
            </Label>
            <Input
              id="restaurantId"
              value={recouvrement.restaurantId}
              className="col-span-3"
              readOnly
            />
          </div>

          {/* Montant */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="montant" className="text-right flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Montant
            </Label>
            <Input
              id="montant"
              value={montantAffiche}
              className="col-span-3 font-semibold text-green-600"
              readOnly
            />
          </div>

          {/* Preuve */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preuve" className="text-right flex items-center gap-2">
              <User className="h-4 w-4" />
              Preuve
            </Label>
            <div className="col-span-3">
              {recouvrement.preuve ? (
                <div className="flex items-center gap-3">
                  <Image
                    src={getFullUrlFile(recouvrement.preuve)}
                    alt="Preuve de recouvrement"
                    width={80}
                    height={60}
                    className="rounded-lg border object-cover"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = getFullUrlFile(recouvrement.preuve);
                      link.download = recouvrement.preuve!;
                      link.click();
                    }}
                  >
                    Télécharger
                  </Button>
                </div>
              ) : (
                <span className="text-gray-400 text-sm">Aucune preuve disponible</span>
              )}
            </div>
          </div>

          {/* Statut */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="statut" className="text-right">
              Statut
            </Label>
            <div className="col-span-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  recouvrement.montant > 0
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {recouvrement.montant > 0 ? "Recouvré" : "En attente"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="cursor-pointer">
              Fermer
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={() => window.print()}
            variant="destructive"
            className="cursor-pointer"
          >
            Imprimer
          </Button>
          {recouvrement.preuve && (
            <Button
              type="button"
              onClick={() => {
                const link = document.createElement("a");
                link.href = getFullUrlFile(recouvrement.preuve);
                link.download = `preuve-recouvrement-${recouvrement.id.slice(0, 8)}.jpg`;
                link.click();
              }}
              variant="default"
              className="cursor-pointer"
            >
              Télécharger preuve
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
