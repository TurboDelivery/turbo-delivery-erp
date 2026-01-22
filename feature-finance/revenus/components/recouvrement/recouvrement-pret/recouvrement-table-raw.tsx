"use client"

import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Download } from "lucide-react"
import { RecouvrementDetailModal } from "./recouvrement-detail-modal"
import { IRecouvrement } from "@/feature-finance/revenus/types/recouvrement/recouvrement.types"
import { getFullUrlFile } from "@/utils/getFullUrlFile"
import Image from "next/image"
import SupprimerRecouvrementModal from "./suppression/supprimer-recouvrement-modal"

interface IRowProps {
  recouv: IRecouvrement
  formatMontant: (montant: number) => string
  formatDate: (dateString: string) => string
  getTotalFacturePourRestaurant: (id: string) => number
  getCumulRecouvrementsAvant: (r: IRecouvrement) => number
  getMontantCumuleJusquAPresent: (r: IRecouvrement) => number
  getResteApresRecouvrement: (r: IRecouvrement) => number
  getResteAvantRecouvrement: (r: IRecouvrement) => number
  setSelectedImage: (url: string) => void
  onViewDetails?: (r: IRecouvrement) => void
}

export function RecouvrementTableRow({
  recouv,
  formatMontant,
  formatDate,
  getTotalFacturePourRestaurant,
  getCumulRecouvrementsAvant,
  getMontantCumuleJusquAPresent,
  getResteApresRecouvrement,
  getResteAvantRecouvrement,
  setSelectedImage,
}: IRowProps) {
  const handleDownloadProof = () => {
    if (!recouv.preuve) return
    const url = getFullUrlFile(recouv.preuve)
    const link = document.createElement("a")
    link.href = url
    link.download = recouv.preuve
    link.target = "_blank"
    link.click()
  }

  return (
    <TableRow className="transition-colors hover:bg-gray-50">
      <TableCell className="text-center text-sm uppercase">{recouv.nomRestaurant}</TableCell>

      <TableCell className="font-semibold text-center text-sm">
        {formatMontant(getTotalFacturePourRestaurant(recouv.restaurantId))} FCFA
      </TableCell>

      <TableCell className="font-semibold text-center text-sm text-blue-600">
        {formatMontant(getMontantCumuleJusquAPresent(recouv))} FCFA
        <div className="text-xs text-gray-500">
          Avant: {formatMontant(getCumulRecouvrementsAvant(recouv))} FCFA
        </div>
      </TableCell>

      <TableCell className="font-semibold text-center text-sm text-red-600">
        {formatMontant(getResteApresRecouvrement(recouv))} FCFA
        <div className="text-xs text-gray-500">
          Avant: {formatMontant(getResteAvantRecouvrement(recouv))} FCFA
        </div>
      </TableCell>

      <TableCell className="text-center text-sm">{formatDate(recouv.dateRecouvrement)}</TableCell>

      <TableCell className="text-center text-sm">
        {recouv.preuve ? (
          <div className="flex flex-col items-center space-y-1">
            <div
              className="relative h-12 w-12 cursor-pointer"
              onClick={() => setSelectedImage(getFullUrlFile(recouv.preuve))}
            >
              <Image
                src={getFullUrlFile(recouv.preuve)}
                alt="Preuve"
                fill
                className="object-cover rounded border"
                sizes="48px"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadProof} className="text-xs">
              <Download className="h-3 w-3 mr-1" /> Télécharger
            </Button>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">Aucune</span>
        )}
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
              <RecouvrementDetailModal recouvrement={recouv} />
            </DropdownMenuItem>
            {recouv.preuve && (
              <DropdownMenuItem onClick={handleDownloadProof}>
                <Download className="h-4 w-4 mr-2" /> Télécharger preuve
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <SupprimerRecouvrementModal recouvrement={recouv} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
