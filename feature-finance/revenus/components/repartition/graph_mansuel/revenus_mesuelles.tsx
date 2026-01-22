"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { ILivraison } from "@/feature-finance/revenus/types/livraison.types"
import { ICommission } from "@/feature-finance/revenus/types/commission.types"
import { useMemo } from "react"

export const description = "Revenus mensuelles"

interface RevenusChartProps {
    livraisons?: ILivraison[];
    commissions?: ICommission[];
}

const chartConfig = {
    revenus: {
        label: "Revenus",
        color: "hsl(142, 75.20%, 44.30%)",
    },
} satisfies ChartConfig

// Fonction pour grouper les revenus par mois
const groupRevenusByMonth = (livraisons: ILivraison[], commissions: ICommission[]) => {
    // Structure initiale pour tous les mois avec valeur 0
    const mois = [
        { mois: 0, nom: "Jan", revenus: 0 },
        { mois: 1, nom: "Fev", revenus: 0 },
        { mois: 2, nom: "Mar", revenus: 0 },
        { mois: 3, nom: "Avr", revenus: 0 },
        { mois: 4, nom: "Mai", revenus: 0 },
        { mois: 5, nom: "Jun", revenus: 0 },
        { mois: 6, nom: "Jul", revenus: 0 },
        { mois: 7, nom: "Aout", revenus: 0 },
        { mois: 8, nom: "Sep", revenus: 0 },
        { mois: 9, nom: "Oct", revenus: 0 },
        { mois: 10, nom: "Nov", revenus: 0 },
        { mois: 11, nom: "Dec", revenus: 0 },
    ]

    // Parcourir toutes les livraisons et les grouper par mois
    livraisons.forEach(livraison => {
        try {
            const date = new Date(livraison.createdAt)
            const month = date.getMonth() // 0-11 (Jan-Déc)
            
            if (month >= 0 && month <= 11) {
                mois[month].revenus += livraison.commission || 0
            }
        } catch (error) {
            console.warn("Erreur de format de date:", livraison.createdAt)
        }
    })

    // Parcourir toutes les commissions et les grouper par mois
    commissions.forEach(commission => {
        try {
            const date = new Date(commission.createdAt)
            const month = date.getMonth() // 0-11 (Jan-Déc)
            
            if (month >= 0 && month <= 11) {
                mois[month].revenus += commission.commission || 0
            }
        } catch (error) {
            console.warn("Erreur de format de date:", commission.createdAt)
        }
    })

    return mois.map(m => ({ month: m.nom, revenus: m.revenus }))
}

export function RevenusMensuellesChart({ livraisons = [], commissions = [] }: RevenusChartProps) {
    // Transformer les données en format pour le graphique
    const chartData = useMemo(() => {
        return groupRevenusByMonth(livraisons, commissions)
    }, [livraisons, commissions])

    // Calculer le maximum pour l'échelle Y
    const maxRevenus = useMemo(() => {
        if (chartData.length === 0) return 100
        const max = Math.max(...chartData.map(item => item.revenus))
        return Math.ceil(max * 1.1) // 10% de marge
    }, [chartData])

    return (
            <div>
                <div  className="pt-0">
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
                                tickFormatter={(value) => value}
                                domain={[0, maxRevenus]}
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                            />
                            <ChartTooltip
                                cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
                                content={<ChartTooltipContent indicator="line" />}
                            />
                            <defs>
                                <linearGradient id="revenusGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(0, 90.70%, 29.40%)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(0, 90.70%, 29.40%)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area
                                dataKey="revenus"
                                type="monotone"
                                fill="url(#revenusGradient)"
                                stroke="hsl(0, 90.70%, 29.40%)"
                                strokeWidth={2}
                                activeDot={{ r: 4, fill: "hsl(0, 90.70%, 29.40%)" }}
                            />
                        </AreaChart>
                    </ChartContainer>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>Revenus mensuels (FCFA)</span>
                        <span>Mois</span>
                    </div>
                </div>
            </div>
        )
}