"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { RevenusMensuellesChart } from "./revenus_mesuelles"
import { ILivraison } from "@/feature-finance/revenus/types/livraison.types"
import { ICommission } from "@/feature-finance/revenus/types/commission.types"
import { RevenusHebdomadaireChart } from "./revenus-hebdomadaire"
import { RevenusJournalierChart } from "./revenus-journaliere"

interface RevenusQuotidiensProps {
    livraisons?: ILivraison[];
    commissions?: ICommission[];
}

export default function RevenusQuotidiens({ livraisons = [], commissions = [] }: RevenusQuotidiensProps) {
    return (
        <div className="w-full px-4 py-6 -mt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold mb-2 ">Gestion des revenus</h2>
           <div>
             <select name="" id="" className="">
                <option value="">Selectionner une periode que Axel va m'envoyer</option>
            </select>
           </div>
            </div>
            <div className="w-full px-4 py-6 shadow-lg rounded-lg border border-gray-200">

                <Tabs defaultValue="revenus-journaliere" className="w-full">
                   
                    <TabsContent value="revenus-journaliere">
                        <RevenusJournalierChart livraisons={livraisons} commissions={commissions} />
                    </TabsContent>
                    <TabsContent value="revenus-hebdomadaire">
                        <RevenusHebdomadaireChart livraisons={livraisons} commissions={commissions} />
                    </TabsContent>
                    <TabsContent value="revenus-mensuelle">
                        <RevenusMensuellesChart livraisons={livraisons} commissions={commissions} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}