"use client"

import { Button } from "@/components/ui/button"
import { Eye, Download } from "lucide-react"
import Image from "next/image"
import { IRecouvrement } from "@/feature-finance/revenus/types/recouvrement/recouvrement.types"
import { getFullUrlFile } from "@/utils/getFullUrlFile"

interface ICardProps {
  recouv: IRecouvrement
  formatMontant: (montant: number) => string
  formatDate: (dateString: string) => string
  getTotalFacturePourRestaurant: (id: string) => number
  getMontantCumuleJusquAPresent: (r: IRecouvrement) => number
  getResteApresRecouvrement: (r: IRecouvrement) => number
  setSelectedImage: (url: string) => void
  onViewDetails?: (r: IRecouvrement) => void
}

export function RecouvrementCardMobile({
  recouv,
  formatMontant,
  formatDate,
  getTotalFacturePourRestaurant,
  getMontantCumuleJusquAPresent,
  getResteApresRecouvrement,
  setSelectedImage,
  onViewDetails,
}: ICardProps) {
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
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm uppercase">{recouv.nomRestaurant}</h3>
          <p className="text-sm text-gray-500">Recouvrement le: {formatDate(recouv.dateRecouvrement)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600 text-sm">Montant facture:</span>
          <span className="font-bold">{formatMontant(getTotalFacturePourRestaurant(recouv.restaurantId))} FCFA</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 text-sm">Montant cumulé:</span>
          <span className="font-bold text-blue-600">{formatMontant(getMontantCumuleJusquAPresent(recouv))} FCFA</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 text-sm">Montant opération:</span>
          <span className="font-bold text-green-600">{formatMontant(recouv.montant)} FCFA</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 text-sm">Reste à recouvrir:</span>
          <span className="font-bold text-red-600">{formatMontant(getResteApresRecouvrement(recouv))} FCFA</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Preuve:</span>
          {recouv.preuve ? (
            <div className="flex items-center space-x-2">
              <div
                className="relative h-10 w-10 cursor-pointer"
                onClick={() => setSelectedImage(getFullUrlFile(recouv.preuve))}
              >
                <Image
                  src={getFullUrlFile(recouv.preuve)}
                  alt="Preuve"
                  fill
                  className="object-cover rounded border"
                  sizes="40px"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadProof} className="text-xs">
                <Download className="h-3 w-3 mr-1" /> Télécharger
              </Button>
            </div>
          ) : (
            <span className="text-gray-400 text-xs">Aucune preuve</span>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <Button size="sm" variant="outline" className="text-xs" onClick={() => onViewDetails?.(recouv)}>
          <Eye className="h-3 w-3 mr-1" /> Détails
        </Button>
      </div>
    </div>
  )
}
