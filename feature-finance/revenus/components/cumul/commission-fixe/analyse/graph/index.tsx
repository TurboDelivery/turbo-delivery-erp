"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommissionMensuelleChart } from "./commission-mensuelle"
import { CommissionJournaliereChart } from "./commission-journaliere"
import { CommissionHebdomadaireChart } from "./commision-hebdomadaire"
import { ICommission } from "@/feature-finance/revenus/types/commission.types"


export default function CommissionAnalyseChart({ commissionFixe }: { commissionFixe: ICommission[] }) {
    return (
        <div className="w-full px-4 py-6 -mt-6">
            <div className="w-full px-4 py-6 shadow-lg rounded-lg border border-gray-200">
                <h2 className="text-xl font-bold mb-2 ">Rapport des commissions(fixe)</h2>

                <Tabs defaultValue="commission-journaliere" className="w-full">
                    <TabsList className="w-full">
                        <TabsTrigger value="commission-journaliere" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Jours</TabsTrigger>
                        <TabsTrigger value="commission-hebdomadaire" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Semaines</TabsTrigger>
                        <TabsTrigger value="commission-mensuelle" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Mois</TabsTrigger>
                    </TabsList>
                    <TabsContent value="commission-journaliere">
                        <CommissionJournaliereChart commissionFixe={commissionFixe} />
                    </TabsContent>
                    <TabsContent value="commission-hebdomadaire">
                        <CommissionHebdomadaireChart commissionFixe={commissionFixe} />
                    </TabsContent>
                    <TabsContent value="commission-mensuelle">
                        <CommissionMensuelleChart commissionFixe={commissionFixe}   />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}