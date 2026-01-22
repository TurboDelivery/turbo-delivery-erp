
import { Pie, PieChart } from "recharts"

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { IDepense } from "@/feature-finance/depenses/types/depense.type"
import { useMemo } from "react"

export const description = "Répartition des dépenses par catégorie"

interface RepartionPieDonutDepenseProps {
    depenses: IDepense[];
}

// Fonction pour grouper les dépenses par catégorie
const groupDepensesByCategorie = (depenses: IDepense[]) => {
    const categoriesMap = new Map<string, number>()
    
    // Parcourir toutes les dépenses et les grouper par catégorie
    depenses.forEach(depense => {
        const categorieName = depense.categorie?.nomCategorie || "Non catégorisé"
        const currentAmount = categoriesMap.get(categorieName) || 0
        categoriesMap.set(categorieName, currentAmount + depense.montant)
    })
    
    // Convertir en tableau pour le graphique
    const colors = [
        "#4CAF50", "#F44336", "#FFEB3B", "#2196F3", 
        "#FF9800", "#9C27B0", "#00BCD4", "#795548",
        "#607D8B", "#E91E63", "#3F51B5", "#009688"
    ]
    
    return Array.from(categoriesMap.entries()).map(([categorie, montant], index) => ({
        categories: categorie,
        montant,
        fill: colors[index % colors.length]
    }))
}


const chartConfig = {
    montant: {
        label: "Montant",
    },
} satisfies ChartConfig

export function RepartionPieDonutDepense({ depenses }: RepartionPieDonutDepenseProps) {
    // Transformer les données des dépenses en format pour le graphique
    const chartData = useMemo(() => {
        return groupDepensesByCategorie(depenses)
    }, [depenses])
    return (
        <Card className="flex flex-col w-full">
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-xl font-bold">Repartition des categories des depenses</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="montant"
                            nameKey="categories"
                            paddingAngle={4}   // ajoute un espace entre chaque couleur
                            stroke="#fff"      // contour blanc pour bien séparer
                            strokeWidth={2}    // épaisseur du contour
                            innerRadius={60}
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex justify-center gap-8 text-sm">
                <div className="flex flex-col gap-2">
                    {chartData.slice(0, 2).map((item) => (
                        <p key={item.categories} className="flex items-center text-xs text-gray-600">
                            <span
                                className="w-3 h-3 rounded-sm mr-2"
                                style={{ backgroundColor: item.fill }}
                            ></span>
                            {item.categories}
                        </p>
                    ))}
                </div>
                {/* Legende */}
                <div className="flex justify-around gap-2">
                    {chartData.slice(2).map((item) => (
                        <p key={item.categories} className="flex justify-between items-center text-xs text-gray-600">
                            <span
                                className="w-3 h-3 rounded-sm mr-2"
                                style={{ backgroundColor: item.fill }}
                            ></span>
                            {item.categories}
                        </p>
                    ))}
                </div>
            </CardFooter>

        </Card>
    )
}
