"use client"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { IDepense } from "@/feature-finance/depenses/types/depense.type"
import { DepenseDetailModal } from "./detail/depenses-detail"
import { ModifierDepenseModal } from "../modifier/modifier-depenses-modal"
import SupprimerDepenseModal from "../supprimer/suprime-depense"

interface DepensesTableProps {
  depenses: IDepense[]
  getCategoriesStyle: (categorieName: string) => string
  formatDate: (dateString: string) => string
  formatMontant: (montant: number) => string
}

export function DepensesTable({ depenses, getCategoriesStyle, formatDate, formatMontant }: DepensesTableProps) {
  return (
    <>
      {/* Version Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-red-500 hover:bg-red-600">
              <TableHead className="font-semibold bg-[#fb2c36] text-white text-center">Date</TableHead>
              <TableHead className="font-semibold bg-[#fb2c36] text-white text-center">Libellé</TableHead>
              <TableHead className="font-semibold bg-[#fb2c36] text-white text-center">Catégorie</TableHead>
              <TableHead className="font-semibold bg-[#fb2c36] text-white text-center">Montant</TableHead>
              <TableHead className="font-semibold bg-[#fb2c36] text-white text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {depenses.map((depense) => (
              <TableRow key={depense.id} className="transition-colors hover:bg-gray-50">
                <TableCell className="text-center text-sm border-b-2">
                  {formatDate(depense.dateDepense)}
                </TableCell>
                <TableCell className="font-medium text-center border-b-2">
                  {depense.libelle}
                </TableCell>
                <TableCell className="text-center border-b-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoriesStyle(depense.categorie.nomCategorie)}`}>
                    {depense.categorie.nomCategorie}
                  </span>
                </TableCell>
                <TableCell className="text-center font-semibold text-red-600 border-b-2">
                  {formatMontant(depense.montant)} FCFA
                </TableCell>
                <TableCell className="text-center border-b-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="hover:bg-red-300 bg-red-500">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                        <DepenseDetailModal depense={depense} />
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                        <ModifierDepenseModal depenses={depense} />
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                        <SupprimerDepenseModal depense={depense} />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Version Mobile */}
      <div className="md:hidden space-y-4 p-4">
        {depenses.map((depense) => (
          <div key={depense.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-sm text-gray-500">{formatDate(depense.dateDepense)}</p>
                <h3 className="font-semibold text-sm md:text-base">{depense.libelle}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoriesStyle(depense.categorie.nomCategorie)}`}>
                {depense.categorie.nomCategorie}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-600 text-sm">Montant:</span>
                <span className="font-bold text-red-600 ml-2">
                  {formatMontant(depense.montant)} FCFA
                </span>
              </div>
              <DepenseDetailModal depense={depense} />
              <ModifierDepenseModal depenses={depense} />
              <SupprimerDepenseModal depense={depense} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
