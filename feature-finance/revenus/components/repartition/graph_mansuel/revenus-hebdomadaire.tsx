"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ILivraison } from "@/feature-finance/revenus/types/livraison.types"
import { ICommission } from "@/feature-finance/revenus/types/commission.types"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useMemo } from "react"

export const description = "Revenus hebdomadaires"

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

// Fonction pour obtenir le numéro de la semaine
const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Fonction pour grouper les revenus par semaine
const groupRevenusByWeek = (livraisons: ILivraison[] = [], commissions: ICommission[] = []) => {
    // Structure initiale pour 52 semaines avec valeur 0
    const semaines: { semaine: number; nom: string; revenus: number }[] = []
    for (let i = 1; i <= 52; i++) {
        semaines.push({ semaine: i, nom: `S${i}`, revenus: 0 })
    }

    // Parcourir toutes les livraisons et les grouper par semaine
    livraisons.forEach(livraison => {
        try {
            if (!livraison.createdAt) return
            
            const date = new Date(livraison.createdAt)
            if (isNaN(date.getTime())) return

            const weekNumber = getWeekNumber(date)
            
            if (weekNumber >= 1 && weekNumber <= 52) {
                const semaine = semaines[weekNumber - 1]
                if (semaine) {
                    semaine.revenus += livraison.commission || 0
                }
            }
        } catch (error) {
            console.warn("Erreur de format de date:", livraison.createdAt)
        }
    })

    // Parcourir toutes les commissions et les grouper par semaine
    commissions.forEach(commission => {
        try {
            if (!commission.createdAt) return
            
            const date = new Date(commission.createdAt)
            if (isNaN(date.getTime())) return

            const weekNumber = getWeekNumber(date)
            
            if (weekNumber >= 1 && weekNumber <= 52) {
                const semaine = semaines[weekNumber - 1]
                if (semaine) {
                    semaine.revenus += commission.commission || 0
                }
            }
        } catch (error) {
            console.warn("Erreur de format de date:", commission.createdAt)
        }
    })

    // Filtrer pour ne garder que les semaines qui ont des revenus ou les 12 premières semaines
    const semainesAvecRevenus = semaines.filter(s => s.revenus > 0)
    
    if (semainesAvecRevenus.length === 0) {
        // Retourner les 12 premières semaines avec des valeurs à 0
        return semaines.slice(0, 12).map(s => ({ week: s.nom, revenus: s.revenus }))
    }
    
    // Retourner les semaines avec revenus (maximum 12)
    return semainesAvecRevenus.slice(0, 12).map(s => ({ week: s.nom, revenus: s.revenus }))
}

export function RevenusHebdomadaireChart({ livraisons = [], commissions = [] }: RevenusChartProps) {
    // Transformer les données des revenus en format pour le graphique
    const chartData = useMemo(() => {
        return groupRevenusByWeek(livraisons, commissions)
    }, [livraisons, commissions])

    // Calculer le maximum pour l'échelle Y
    const maxRevenus = useMemo(() => {
        if (chartData.length === 0) return 100
        
        const values = chartData.map(item => item.revenus).filter(value => !isNaN(value))
        if (values.length === 0) return 100
        
        const max = Math.max(...values)
        return Math.ceil(max * 1.1) // 10% de marge
    }, [chartData])

    // Si pas de données, afficher un message
    if (chartData.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center border rounded-lg">
                <p className="text-gray-500">Aucune donnée de revenus disponible</p>
            </div>
        )
    }

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
                            dataKey="week"
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
                            tickFormatter={(value) => `${value.toLocaleString()} FCFA`}
                            domain={[0, maxRevenus]}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <ChartTooltip
                            cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
                            content={<ChartTooltipContent 
                                indicator="line" 
                                formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, "Revenus"]}
                            />}
                        />
                        <defs>
                            <linearGradient id="revenusGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(142, 75.20%, 44.30%)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(142, 75.20%, 44.30%)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area
                            dataKey="revenus"
                            type="monotone"
                            fill="url(#revenusGradient)"
                            stroke="hsl(142, 75.20%, 44.30%)"
                            strokeWidth={2}
                            activeDot={{ r: 4, fill: "hsl(142, 75.20%, 44.30%)" }}
                        />
                    </AreaChart>
                </ChartContainer>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Revenus hebdomadaires (FCFA)</span>
                    <span>Semaine</span>
                </div>
            </div>
        </div>
    )
}