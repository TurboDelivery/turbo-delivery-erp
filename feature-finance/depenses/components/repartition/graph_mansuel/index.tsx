"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DepensesJournaliereChart } from "./depenses-journaliere"
import { DepensesHebdomadaireChart } from "./depenses-hebdomadaire"
import { DepensesChart } from "./depenses_mesuelles"
import { IDepense } from "@/feature-finance/depenses/types/depense.type"

interface DepenseQuotidienneProps {
    depenses: IDepense[];
}

export default function DepenseQuotidienne({ depenses }: DepenseQuotidienneProps) {
    return (
        <div className="w-full px-4 py-6 -mt-6">
            <div className="w-full px-4 py-6 shadow-lg rounded-lg border border-gray-200">
                <h2 className="text-xl font-bold mb-2 ">Rapport des depenses</h2>

                <Tabs defaultValue="depenses-journaliere" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full gap-2">
                        <TabsTrigger value="depenses-journaliere" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Jours</TabsTrigger>
                        <TabsTrigger value="depenses-hebdomadaire" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Semaines</TabsTrigger>
                        <TabsTrigger value="depenses-mensuelle" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Mois</TabsTrigger>
                    </TabsList>
                    <TabsContent value="depenses-journaliere">
                        <DepensesJournaliereChart depenses={depenses} />
                    </TabsContent>
                    <TabsContent value="depenses-hebdomadaire">
                        <DepensesHebdomadaireChart depenses={depenses}/>
                    </TabsContent>
                    <TabsContent value="depenses-mensuelle">
                        <DepensesChart depenses={depenses}/>
                    </TabsContent>
                </Tabs> 
            </div>
        </div>
    )
}