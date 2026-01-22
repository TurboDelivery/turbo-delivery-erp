"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RevenusChart } from "./revenus-mensuels"
import { DepensesChart } from "./depenses_mesuelles"
import { ComptesChart } from "./comptes-mensuels"

export default function Performance() {
    return (
        <div className="w-full px-4 py-6">
            <div className="w-full px-4 py-6 shadow-lg rounded-lg border border-gray-200">
                <h2 className="text-xl font-bold mb-2 ">Rapport financiers mensuels</h2>

                <Tabs defaultValue="revenus" className="w-full">
                    <TabsList className="w-full">
                    <TabsTrigger value="revenus" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Revenus</TabsTrigger>
                        <TabsTrigger value="depenses" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Depenses</TabsTrigger>
                        <TabsTrigger value="comptes" className="data-[state=active]:bg-red-500 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white">Comptes</TabsTrigger>
                    </TabsList>
                    <TabsContent value="revenus">
                        <RevenusChart />
                    </TabsContent>
                    <TabsContent value="depenses">
                        <DepensesChart />
                    </TabsContent>
                    <TabsContent value="comptes">
                        <ComptesChart />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}