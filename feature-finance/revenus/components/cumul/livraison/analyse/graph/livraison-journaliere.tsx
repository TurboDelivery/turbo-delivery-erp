"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { ILivraison } from "@/feature-finance/revenus/types/livraison.types"
import { useMemo } from "react"

export const description = "Livraison journalière"

interface LivraisonJournaliereProps {
    livraison?: ILivraison[];
}

// Fonction pour grouper les livraisons par jour de la semaine
const groupLivraisonByDay = (livraison: ILivraison[]) => {
    // Structure initiale pour les 7 jours avec valeur 0
    const jours = [
        { day: "Lun", livraison: 0 },
        { day: "Mar", livraison: 0 },
        { day: "Mer", livraison: 0 },
        { day: "Jeu", livraison: 0 },
        { day: "Ven", livraison: 0 },
        { day: "Sam", livraison: 0 },
        { day: "Dim", livraison: 0 },
    ]

    // Parcourir toutes les livraisons et les grouper par jour
    livraison.forEach(livraison => {
        try {
            const date = new Date(livraison.createdAt)
            const dayOfWeek = date.getDay() // 0-6 (Dim-Lun)
            // Convertir en format Lun-Dim (0=Dimanche, 1=Lundi...)
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            
            if (adjustedDay >= 0 && adjustedDay <= 6) {
                jours[adjustedDay].livraison += livraison.fraisLivraison
            }
        } catch (error) {
            console.warn("Erreur de format de date:", livraison.createdAt)
        }
    })

    return jours
}

const chartConfig = {
    livraison: {
        label: "Livraison journalière",
        color: "hsl(47, 81.50%, 48.80%)", 
    },
} satisfies ChartConfig

export function LivraisonJournaliereChart({ livraison = [] }: LivraisonJournaliereProps) {
    // Transformer les données des livraisons en format pour le graphique
    const chartData = useMemo(() => {
        return groupLivraisonByDay(livraison)
    }, [livraison])

    // Calculer le maximum pour l'échelle Y
    const maxLivraison = useMemo(() => {
        if (chartData.length === 0) return 100
        const max = Math.max(...chartData.map(item => item.livraison))
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
                                dataKey="day"
                                tickLine={false}
                                axisLine={{ stroke: "#d1d5db" }}
                                tickMargin={8}
                                tickFormatter={(value) => `${value}`}
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={{ stroke: "#d1d5db" }}
                                tickMargin={8}
                                tickCount={6}
                                tickFormatter={(value) => value }
                                domain={[0, maxLivraison]}
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                            />
                            <ChartTooltip
                                cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
                                content={<ChartTooltipContent indicator="line" />}
                            />
                            <defs>
                                <linearGradient id="livraisonGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(47, 81.50%, 48.80%)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(47, 81.50%, 48.80%)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area
                                dataKey="livraison"
                                type="monotone"
                                fill="url(#livraisonGradient)"
                                stroke="hsl(47, 81.50%, 48.80%)"
                                strokeWidth={2}
                                activeDot={{ r: 4, fill: "hsl(47, 81.50%, 48.80%)" }}
                            />
                        </AreaChart>
                    </ChartContainer>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>Livraison journalière (FCFA)</span>
                        <span>Jours</span>
                    </div>
                </div>
            </div>
        )
    }