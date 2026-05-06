"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { ICommission } from "@/features/revenus/types/commission.types"
import { useMemo } from "react"

export const description = "Commission journalières"

interface CommissionJournaliereProps {
    commission?: ICommission[]; // Rendre la prop optionnelle
}

// Fonction pour grouper les dépenses par jour de la semaine
const groupCommissionByDay = (commission: ICommission[] = []) => {
    // Structure initiale pour tous les jours de la semaine avec valeur 0
    const jours = [
        { jour: 1, nom: "Lun", commission: 0 },
        { jour: 2, nom: "Mar", commission: 0 },
        { jour: 3, nom: "Mer", commission: 0 },
        { jour: 4, nom: "Jeu", commission: 0 },
        { jour: 5, nom: "Ven", commission: 0 },
        { jour: 6, nom: "Sam", commission: 0 },
        { jour: 0, nom: "Dim", commission: 0 },
    ]

    // Vérifier que commission est défini et est un tableau
    if (!commission || !Array.isArray(commission)) {
        return jours.map(j => ({ day: j.nom, commission: j.commission }))
    }

    // Parcourir toutes les dépenses et les grouper par jour de la semaine
    commission.forEach(commissionItem => {
        try {
            const date = new Date(commissionItem.createdAt)
            const dayOfWeek = date.getDay() // 0-6 (Dim-Lun)
            
            if (dayOfWeek >= 0 && dayOfWeek <= 6) {
                const jour = jours.find(j => j.jour === dayOfWeek)
                if (jour) {
                    jour.commission += commissionItem.commission || 0
                }
            }
        } catch (error) {
            console.warn("Erreur de format de date:", commissionItem.createdAt)
        }
    })

    return jours.map(j => ({ day: j.nom, commission: j.commission }))
}

const chartConfig = {
    commission: {
        label: "Commission(pourcentage) journalières",
        color: "hsl(47, 81.50%, 48.80%)", 
    },
} satisfies ChartConfig

export function CommissionJournaliereChart({ commission = [] }: CommissionJournaliereProps) {
    // Transformer les données des dépenses en format pour le graphique
    const chartData = useMemo(() => {
        return groupCommissionByDay(commission)
    }, [commission])

    // Calculer le maximum pour l'échelle Y
    const maxCommission = useMemo(() => {
        if (chartData.length === 0) return 100
        const max = Math.max(...chartData.map(item => item.commission))
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
                            dataKey="day"
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
                            tickFormatter={(value) => value }
                            domain={[0, maxCommission]}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <ChartTooltip
                            cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <defs>
                            <linearGradient id="commissionGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(47, 81.50%, 48.80%)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(47, 81.50%, 48.80%)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area
                            dataKey="commission"
                            type="monotone"
                            fill="url(#commissionGradient)"
                            stroke="hsl(47, 81.50%, 48.80%)"
                            strokeWidth={2}
                            activeDot={{ r: 4, fill: "hsl(47, 81.50%, 48.80%)" }}
                        />
                    </AreaChart>
                </ChartContainer>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Commission journalière (FCFA)</span>
                    <span>Jour</span>
                </div>
            </div>
        </div>
    )
}