"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useMemo } from "react"
import { ILivraison } from "@/features/revenus/types/livraison.types"
import { formatMontant } from '@/utils/format.utils';

export const description = "Livraison mensuelle"

interface LivraisonMensuelleProps {
    livraison?: ILivraison[];
}

const chartConfig = {
    livraison: {
        label: "Livraison mensuelle",
        color: "hsl(0, 90.70%, 29.40%)", 
    },
} satisfies ChartConfig

// Fonction pour grouper les livraisons par mois
const groupLivraisonByMonth = (livraison: ILivraison[]) => {
    // Structure initiale pour tous les mois avec valeur 0
    const mois = [
        { mois: 0, nom: "Jan", livraison: 0 },
        { mois: 1, nom: "Fev", livraison: 0 },
        { mois: 2, nom: "Mar", livraison: 0 },
        { mois: 3, nom: "Avr", livraison: 0 },
        { mois: 4, nom: "Mai", livraison: 0 },
        { mois: 5, nom: "Jun", livraison: 0 },
        { mois: 6, nom: "Jul", livraison: 0 },
        { mois: 7, nom: "Aout", livraison: 0 },
        { mois: 8, nom: "Sep", livraison: 0 },
        { mois: 9, nom: "Oct", livraison: 0 },
        { mois: 10, nom: "Nov", livraison: 0 },
        { mois: 11, nom: "Dec", livraison: 0 },
    ]

    // Parcourir toutes les commissions et les grouper par mois
    livraison.forEach(livraison => {
        try {
            const date = new Date(livraison.createdAt)
            const month = date.getMonth() // 0-11 (Jan-Déc)
            
            if (month >= 0 && month <= 11) {
                mois[month].livraison += livraison.commission
            }
        } catch (error) {
            console.warn("Erreur de format de date:", livraison.createdAt)
        }
    })

    return mois.map(m => ({ month: m.nom, livraison: m.livraison }))
}

export function LivraisonMensuelleChart({ livraison = [] }: LivraisonMensuelleProps) {
    // Transformer les données des livraisons en format pour le graphique
    const chartData = useMemo(() => {
        return groupLivraisonByMonth(livraison)
    }, [livraison])

    // Calculer le maximum pour l'échelle Y
    const maxLivraison = useMemo(() => {
        if (chartData.length === 0) return 100
        const max = Math.max(...chartData.map(item => item.livraison))
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
                            domain={[0, maxLivraison]}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <ChartTooltip
                            cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <defs>
                            <linearGradient id="livraisonGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(0, 90.70%, 29.40%)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(0, 90.70%, 29.40%)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area
                            dataKey="livraison"
                            type="monotone"
                            fill="url(#livraisonGradient)"
                            stroke="hsl(0, 90.70%, 29.40%)"
                            strokeWidth={2}
                            activeDot={{ r: 4, fill: "hsl(0, 90.70%, 29.40%)" }}
                        />
                    </AreaChart>
                </ChartContainer>
                <div className="flex justify-between items-center mt-2 text-xs text-muted">
                    <span>Livraison mensuelle (FCFA)</span>
                    <span>Mois</span>
                </div>
                
                {/* Affichage des données réelles pour le débogage */}
                <div className="mt-4 text-xs text-muted">
                    <p>Total livraison: {formatMontant(livraison.reduce((sum, d) => sum + d.fraisLivraison, 0))}</p>
                    <p>Nombre de transactions: {livraison.length}</p>
                </div>
            </div>
        </div>
    )
}