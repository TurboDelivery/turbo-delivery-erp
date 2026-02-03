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
    periodeType?: "mois" | "annee" | "personnalise";
}

const chartConfig = {
    revenus: {
        label: "Revenus",
        color: "hsl(142, 75.20%, 44.30%)",
    },
} satisfies ChartConfig

// Fonction pour grouper les revenus par mois (pour l'année)
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

// Fonction pour grouper les revenus par jour du mois (pour le mois en cours)
const groupRevenusByDayOfMonth = (livraisons: ILivraison[], commissions: ICommission[]) => {
    // Obtenir le nombre de jours dans le mois en cours
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    
    // Structure initiale pour tous les jours du mois
    const jours: { jour: number; nom: string; revenus: number }[] = []
    for (let i = 1; i <= daysInMonth; i++) {
        jours.push({ jour: i, nom: `${i}`, revenus: 0 })
    }

    // Parcourir toutes les livraisons et les grouper par jour du mois
    livraisons.forEach(livraison => {
        try {
            if (!livraison.createdAt) return
            
            const date = new Date(livraison.createdAt)
            if (isNaN(date.getTime())) return

            // Vérifier si la livraison est dans le mois en cours
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                const dayOfMonth = date.getDate()
                if (dayOfMonth >= 1 && dayOfMonth <= daysInMonth) {
                    const jourData = jours.find(j => j.jour === dayOfMonth)
                    if (jourData) {
                        jourData.revenus += livraison.commission || 0
                    }
                }
            }
        } catch (error) {
            console.warn("Erreur de format de date:", livraison.createdAt)
        }
    })

    // Parcourir toutes les commissions et les grouper par jour du mois
    commissions.forEach(commission => {
        try {
            if (!commission.createdAt) return
            
            const date = new Date(commission.createdAt)
            if (isNaN(date.getTime())) return

            // Vérifier si la commission est dans le mois en cours
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                const dayOfMonth = date.getDate()
                if (dayOfMonth >= 1 && dayOfMonth <= daysInMonth) {
                    const jourData = jours.find(j => j.jour === dayOfMonth)
                    if (jourData) {
                        jourData.revenus += commission.commission || 0
                    }
                }
            }
        } catch (error) {
            console.warn("Erreur de format de date:", commission.createdAt)
        }
    })

    return jours.map(j => ({ day: j.nom, revenus: j.revenus }))
}

export function RevenusMensuellesChart({ livraisons = [], commissions = [], periodeType = "mois" }: RevenusChartProps) {
    // Transformer les données en format pour le graphique
    const chartData = useMemo(() => {
        // Si le type de période est "mois" et qu'on a peu de données, utiliser les jours
        if (periodeType === "mois" && livraisons.length + commissions.length <= 30) {
            return groupRevenusByDayOfMonth(livraisons, commissions)
        }
        
        // Pour "annee" et "personnalise", toujours utiliser les mois
        return groupRevenusByMonth(livraisons, commissions)
    }, [livraisons, commissions, periodeType])

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

    // Déterminer si on utilise des jours ou des mois
    const useDays = 'day' in chartData[0] || chartData.some(item => 'day' in item)
    const dataKey = useDays ? "day" : "month"

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
                            dataKey={dataKey}
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
                    <span>Revenus {useDays ? 'quotidiens' : 'mensuels'} (FCFA)</span>
                    <span>{useDays ? 'Jour' : 'Mois'}</span>
                </div>
            </div>
        </div>
    )
}