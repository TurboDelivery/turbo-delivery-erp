"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LivraisonHebdomadaireChart } from "./livraison-hebdomadaire"
import { LivraisonMensuelleChart } from "./livraison_mensuelle"
import { LivraisonJournaliereChart } from "./livraison-journaliere"
import { ILivraison } from "@/feature-finance/revenus/types/livraison.types"

export default function LivraisonAnalyseChart({ livraison }: { livraison: ILivraison[] }) {
    return (
        <div className="w-full px-4 py-6 -mt-6">
            <div className="w-full px-4 py-6 shadow-lg rounded-lg border border-gray-200">
                <h2 className="text-xl font-bold mb-2 ">Rapport des revenus</h2>

                <Tabs defaultValue="livraison-journaliere" className="w-full">
                    <TabsList className="w-full">
                        <TabsTrigger value="livraison-journaliere" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Jours</TabsTrigger>
                        <TabsTrigger value="livraison-hebdomadaire" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Semaines</TabsTrigger>
                        <TabsTrigger value="livraison-mensuelle" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Mois</TabsTrigger>
                    </TabsList>
                    <TabsContent value="livraison-journaliere">
                        <LivraisonJournaliereChart livraison={livraison}/>
                    </TabsContent>
                    <TabsContent value="livraison-hebdomadaire">
                        <LivraisonHebdomadaireChart livraison={livraison}/>
                    </TabsContent>
                    <TabsContent value="livraison-mensuelle">
                        <LivraisonMensuelleChart livraison={livraison}/>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}