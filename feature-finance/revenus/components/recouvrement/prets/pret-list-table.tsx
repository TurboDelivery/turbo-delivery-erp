"use client"

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye } from "lucide-react"
import { IFacture } from "@/feature-finance/revenus/types/recouvrement/prets.types"
import { PretDetailModal } from "./pret-detail-modal"

interface IPretTableProps {
    facture: IFacture[]
    // getCouleurStatut: (statut: IFacture) => string
    // formatStatus: (statut: IFacture) => string
    formatDate: (dateString: string) => string
    formatMontant: (montant: number) => string
}

export function PretTable({ facture, formatMontant }: IPretTableProps) {
    return (
        <>
            {/* Version Desktop */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-green-500 hover:bg-red-600">
                            <TableHead className="font-semibold text-white text-center">Partenaire</TableHead>
                            <TableHead className="font-semibold text-white text-center">frais de livraison</TableHead>
                            <TableHead className="font-semibold text-white text-center">commission </TableHead>
                            <TableHead className="font-semibold text-white text-center">total facture</TableHead>
                            <TableHead className="font-semibold text-white text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {facture.map((facture) => {
                            // calcul de la somme des recouvrements
                            const montantRecouvre = facture.recouvrement?.reduce(
                                (total, rec) => total + (Number(rec.montant) || 0),
                                0
                            ) || 0

                            return (
                                <TableRow key={facture.id} className="transition-colors hover:bg-gray-50">
                                    <TableCell className="text-center text-sm uppercase">
                                        {facture.nomRestaurant}
                                    </TableCell>

                                    <TableCell className="font-semibold text-center text-sm">
                                        {formatMontant(facture.totalFraisLivraisons)} FCFA
                                    </TableCell>

                                    <TableCell className="font-semibold text-center text-sm">
                                        {formatMontant(facture.totalCommission)} FCFA
                                    </TableCell>

                                    <TableCell className="text-center font-semibold text-red-600">
                                        {formatMontant(facture.totalFraisLivraisons + facture.totalCommission)} FCFA
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="outline">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                    <PretDetailModal facture={facture} />
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Version Mobile */}
            <div className="md:hidden space-y-4 p-4">
                {facture.map((facture) => (
                    <div key={facture.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm md:text-base uppercase">{facture.nomRestaurant}</h3>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-gray-600 text-sm">Montant facture:</span>
                                <span className="font-bold text-red-600 ml-2">
                                    {formatMontant(facture.totalFraisLivraisons + facture.totalCommission)} FCFA
                                </span>
                            </div>
                            <div className="mt-3">
                                <PretDetailModal facture={facture} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
