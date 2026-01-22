import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { CheckCircle, Clock, FileText, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link";
import { IRecouvrement } from "@/feature-finance/revenus/types/recouvrement/recouvrement.types";
import { IFacture } from "@/feature-finance/revenus/types/recouvrement/prets.types";

interface DetailRecouvrementProps {
  recouvrements: IRecouvrement[];
  factures: IFacture[];
}

export default function DetailRecouvrement({ recouvrements, factures }: DetailRecouvrementProps) {
  // Calculer le total à recouvrir à partir des factures
  const totalARecouvrir = factures.reduce((total, facture) => {
    return total + facture.totalFraisLivraisons + facture.totalCommission;
  }, 0);

  // Calculer le total payé à partir des recouvrements
  const totalPayes = recouvrements.reduce((total, recouvrement) => {
    return total + recouvrement.montant;
  }, 0);

  // Calculer le reste à recouvrir
  const totalResteARecouvrir = totalARecouvrir - totalPayes;

  // Calcul du pourcentage de recouvrement
  const pourcentageRecouvrement = totalARecouvrir > 0 
    ? Math.round((totalPayes / totalARecouvrir) * 100) 
    : 0;

  const recouvrementsData = [
    {
      id: 1,
      date: "14 Sept. 2025",
      montant: totalARecouvrir,
      type: "Total à recouvrir",
      couleur: "border-l-4 border-l-blue-500 bg-blue-50/50",
      icone: <FileText className="h-5 w-5 text-blue-600" />,
      tendance: "neutral" as const,
    },
    {
      id: 2,
      date: "14 Sept. 2025",
      montant: totalPayes,
      type: "Total payé",
      couleur: "border-l-4 border-l-green-500 bg-green-50/50",
      icone: <CheckCircle className="h-5 w-5 text-green-600" />,
      tendance: "up" as const,
    },
    {
      id: 3,
      date: "14 Sept. 2025",
      montant: totalResteARecouvrir,
      type: "Reste à recouvrir",
      couleur: "border-l-4 border-l-amber-500 bg-amber-50/50",
      icone: <AlertCircle className="h-5 w-5 text-amber-600" />,
      tendance: "down" as const,
    }
  ]

  return (
    <div className="p-4 md:p-6">
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Détails des recouvrements
            </CardTitle>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {pourcentageRecouvrement}% recouvré
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recouvrementsData.map((recouvrement) => (
            <Card 
              key={recouvrement.id} 
              className={`rounded-lg p-0 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${recouvrement.couleur}`}
            >
              <Link href={`/recouvrement`}>
                <CardHeader className="pb-2 pt-5 px-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      {recouvrement.type}
                    </CardTitle>
                    {recouvrement.icone}
                  </div>
                </CardHeader>
                <CardContent className="pb-3 px-5">
                  <p className="text-2xl font-bold text-gray-900">
                    {recouvrement.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                  </p>
                  {/* Indicateur de tendance */}
                  {recouvrement.tendance !== "neutral" && (
                    <div className={`flex items-center mt-2 text-xs font-medium ${
                      recouvrement.tendance === "up" 
                        ? "text-green-600" 
                        : "text-amber-600"
                    }`}>
                      {recouvrement.tendance === "up" ? (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          <span>+12% ce mois</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                          <span>En attente</span>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Link>
              {/* <CardFooter className="bg-white py-3 px-5 border-t">
                <div className="flex justify-between items-center w-full">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    recouvrement.statut === "Payé" 
                      ? "bg-green-100 text-green-800" 
                      : recouvrement.statut === "Partiellement payé"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {recouvrement.statut}
                  </span>
                  <span className="text-xs text-gray-500">
                    {recouvrement.date}
                  </span>
                </div>
              </CardFooter> */}
            </Card>
          ))}
        </CardContent>
        
        {/* Barre de progression */}
        <CardFooter className="pt-0 px-5 pb-5">
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progression du recouvrement</span>
              <span className="text-sm text-gray-500">{pourcentageRecouvrement}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${pourcentageRecouvrement}%` }}
              ></div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
