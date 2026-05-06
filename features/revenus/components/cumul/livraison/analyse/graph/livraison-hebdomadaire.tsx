"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { ILivraison } from "@/features/revenus/types/livraison.types"
import { useMemo } from "react"

export const description = "Livraison hebdomadaire"

interface LivraisonHebdomadaireProps {
    livraison?: ILivraison[];
}

// Fonction pour grouper les livraisons par semaine de l'année
const groupLivraisonByWeek = (livraison: ILivraison[]) => {
    // Structure initiale pour 52 semaines avec valeur 0
    const semaines: { semaine: number; nom: string; livraison: number }[] = []
    for (let i = 1; i <= 52; i++) {
        semaines.push({ semaine: i, nom: `S${i}`, livraison: 0 })
    }

    // Parcourir toutes les livraisons et les grouper par semaine
    livraison.forEach(livraison => {
        try {
            const date = new Date(livraison.createdAt)
            const weekNumber = getWeekNumber(date)
            
            if (weekNumber >= 1 && weekNumber <= 52) {
                semaines[weekNumber - 1].livraison += livraison.fraisLivraison
            }
        } catch (error) {
            console.warn("Erreur de format de date:", livraison.createdAt)
        }
    })

    // Filtrer pour ne garder que les semaines qui ont des livraisons ou les 12 premières semaines
    const semainesAvecLivraison = semaines.filter(s => s.livraison > 0)
    if (semainesAvecLivraison.length === 0) {
        return semaines.slice(0, 12).map(s => ({ week: s.nom, livraison: s.livraison }))
    }
    
    return semainesAvecLivraison.slice(0, 12).map(s => ({ week: s.nom, livraison: s.livraison }))
}

// Fonction pour obtenir le numéro de la semaine
const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const chartConfig = {
    livraison: {
        label: "Livraison",
        color: "hsl(142, 75.20%, 44.30%)", 
    },
} satisfies ChartConfig

export function LivraisonHebdomadaireChart({ livraison = [] }: LivraisonHebdomadaireProps) {
    // Transformer les données des livraisons en format pour le graphique
    const chartData = useMemo(() => {
        return groupLivraisonByWeek(livraison)
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
                                tickFormatter={(value) => value}
                                domain={[0, maxLivraison]}
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                            />
                            <ChartTooltip
                                cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
                                content={<ChartTooltipContent indicator="line" />}
                            />
                            <defs>
                                <linearGradient id="livraisonGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(142, 75.20%, 44.30%)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(142, 75.20%, 44.30%)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area
                                dataKey="livraison"
                                type="monotone"
                                fill="url(#livraisonGradient)"
                                stroke="hsl(142, 75.20%, 44.30%)"
                                strokeWidth={2}
                                activeDot={{ r: 4, fill: "hsl(142, 75.20%, 44.30%)" }}
                            />
                        </AreaChart>
                    </ChartContainer>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>Livraison hebdomadaire (FCFA)</span>
                        <span>Semaine</span>
                    </div>
                </div>
            </div>
        )
    }