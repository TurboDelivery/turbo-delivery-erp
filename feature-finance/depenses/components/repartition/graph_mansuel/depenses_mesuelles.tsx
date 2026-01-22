"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { IDepense } from "@/feature-finance/depenses/types/depense.type"
import { useMemo } from "react"

export const description = "Dépenses mensuelles"

interface DepensesMensuellesProps {
    depenses: IDepense[];
}

const chartConfig = {
    depenses: {
        label: "Dépenses",
        color: "hsl(0, 90.70%, 29.40%)", 
    },
} satisfies ChartConfig

// Fonction pour grouper les dépenses par mois
const groupDepensesByMonth = (depenses: IDepense[]) => {
    // Structure initiale pour tous les mois avec valeur 0
    const mois = [
        { mois: 0, nom: "Jan", depenses: 0 },
        { mois: 1, nom: "Fev", depenses: 0 },
        { mois: 2, nom: "Mar", depenses: 0 },
        { mois: 3, nom: "Avr", depenses: 0 },
        { mois: 4, nom: "Mai", depenses: 0 },
        { mois: 5, nom: "Jun", depenses: 0 },
        { mois: 6, nom: "Jul", depenses: 0 },
        { mois: 7, nom: "Aout", depenses: 0 },
        { mois: 8, nom: "Sep", depenses: 0 },
        { mois: 9, nom: "Oct", depenses: 0 },
        { mois: 10, nom: "Nov", depenses: 0 },
        { mois: 11, nom: "Dec", depenses: 0 },
    ]

    // Parcourir toutes les dépenses et les grouper par mois
    depenses.forEach(depense => {
        try {
            const date = new Date(depense.dateDepense)
            const month = date.getMonth() // 0-11 (Jan-Déc)
            
            if (month >= 0 && month <= 11) {
                mois[month].depenses += depense.montant
            }
        } catch (error) {
            console.warn("Erreur de format de date:", depense.dateDepense)
        }
    })

    return mois.map(m => ({ month: m.nom, depenses: m.depenses }))
}

export function DepensesChart({ depenses }: DepensesMensuellesProps) {
    // Transformer les données des dépenses en format pour le graphique
    const chartData = useMemo(() => {
        return groupDepensesByMonth(depenses)
    }, [depenses])

    // Calculer le maximum pour l'échelle Y
    const maxDepense = useMemo(() => {
        if (chartData.length === 0) return 100
        const max = Math.max(...chartData.map(item => item.depenses))
        return Math.ceil(max * 1.1) // 10% de marge
    }, [chartData])

    return (
        <div>
            <div className="pt-0">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            top: 5,
                            right: 5,
                            left: 0,
                            bottom: 5,
                        }}
                        width={350}
                        height={300}
                    >
                        <CartesianGrid 
                            vertical={false} 
                            strokeDasharray="3 3" 
                            stroke="#f0f0f0" 
                        />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={{ stroke: "#d1d5db" }}
                            tickMargin={8}
                            tickFormatter={(value) => value}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={{ stroke: "#d1d5db" }}
                            tickMargin={8}
                            tickCount={6}
                            tickFormatter={(value) => `${value}`}
                            domain={[0, maxDepense]}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <ChartTooltip
                            cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <defs>
                            <linearGradient id="depensesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(0, 90.70%, 29.40%)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(0, 90.70%, 29.40%)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area
                            dataKey="depenses"
                            type="monotone"
                            fill="url(#depensesGradient)"
                            stroke="hsl(0, 90.70%, 29.40%)"
                            strokeWidth={2}
                            activeDot={{ r: 4, fill: "hsl(0, 90.70%, 29.40%)" }}
                        />
                    </AreaChart>
                </ChartContainer>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Dépenses mensuelles (FCFA)</span>
                    <span>Mois</span>
                </div>
                
                {/* Affichage des données réelles pour le débogage */}
                <div className="mt-4 text-xs text-gray-400">
                    <p>Total dépenses: {depenses.reduce((sum, d) => sum + d.montant, 0).toLocaleString()} FCFA</p>
                    <p>Nombre de transactions: {depenses.length}</p>
                </div>
            </div>
        </div>
    )
}