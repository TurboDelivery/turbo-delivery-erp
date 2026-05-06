"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ILivraison } from "@/features/revenus/types/livraison.types"
import { ICommission } from "@/features/revenus/types/commission.types"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useMemo } from "react"

export const description = "Revenus journaliers"

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

// Fonction pour formater la date en JJ/MM
const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${day}/${month}`
}

// Fonction pour grouper les revenus par jour
const groupRevenusByDay = (livraisons: ILivraison[] = [], commissions: ICommission[] = []) => {
    // Obtenir la date d'il y a 30 jours et aujourd'hui
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    // Créer un objet pour stocker les revenus par date
    const revenusParJour: { [key: string]: number } = {}

    // Initialiser les 30 derniers jours avec des revenus à 0
    const dates = []
    for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(today.getDate() - i)
        const dateKey = date.toISOString().split('T')[0] // Format YYYY-MM-DD
        const dateFormatted = formatDate(date)
        
        revenusParJour[dateKey] = 0
        dates.push({ date: dateKey, dateFormatted, revenus: 0 })
    }

    // Parcourir toutes les livraisons et les grouper par jour
    livraisons.forEach(livraison => {
        try {
            if (!livraison.createdAt) return
            
            const date = new Date(livraison.createdAt)
            if (isNaN(date.getTime())) return

            // Vérifier si la date est dans les 30 derniers jours
            if (date >= thirtyDaysAgo && date <= today) {
                const dateKey = date.toISOString().split('T')[0]
                if (revenusParJour.hasOwnProperty(dateKey)) {
                    revenusParJour[dateKey] += livraison.commission || 0
                }
            }
        } catch (error) {
            console.warn("Erreur de format de date:", livraison.createdAt)
        }
    })

    // Parcourir toutes les commissions et les grouper par jour
    commissions.forEach(commission => {
        try {
            if (!commission.createdAt) return
            
            const date = new Date(commission.createdAt)
            if (isNaN(date.getTime())) return

            // Vérifier si la date est dans les 30 derniers jours
            if (date >= thirtyDaysAgo && date <= today) {
                const dateKey = date.toISOString().split('T')[0]
                if (revenusParJour.hasOwnProperty(dateKey)) {
                    revenusParJour[dateKey] += commission.commission || 0
                }
            }
        } catch (error) {
            console.warn("Erreur de format de date:", commission.createdAt)
        }
    })

    // Mettre à jour les dates avec les revenus calculés
    return dates.map(item => ({
        day: item.dateFormatted,
        revenus: revenusParJour[item.date]
    }))
}

export function RevenusJournalierChart({ livraisons = [], commissions = [] }: RevenusChartProps) {
    // Transformer les données des revenus en format pour le graphique
    const chartData = useMemo(() => {
        return groupRevenusByDay(livraisons, commissions)
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
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 20,
                            left: 60,
                            bottom: 20,
                        }}
                        width={350}
                        height={400}
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
                            interval="preserveStartEnd"
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
                                labelFormatter={(label, payload) => {
                                    if (payload && payload.length > 0) {
                                        // Reconstruire la date complète pour l'affichage dans le tooltip
                                        const today = new Date()
                                        const day = label.split('/')[0]
                                        const month = label.split('/')[1]
                                        const year = today.getFullYear()
                                        return `Date: ${day}/${month}/${year}`
                                    }
                                    return `Jour: ${label}`
                                }}
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
                    <span>Revenus journaliers (FCFA)</span>
                    <span>Date (JJ/MM)</span>
                </div>
            </div>
        </div>
    )
}