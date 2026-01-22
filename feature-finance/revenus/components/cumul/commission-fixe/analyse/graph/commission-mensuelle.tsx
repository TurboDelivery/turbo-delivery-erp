"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useMemo } from "react"
import { ICommission } from "@/feature-finance/revenus/types/commission.types"

export const description = "Commission mensuelle"

interface CommissionMensuelleProps {
    commissionFixe?: ICommission[];
}

const chartConfig = {
    commissionFixe: {
        label: "Commission Fixe",
        color: "hsl(0, 90.70%, 29.40%)", 
    },
} satisfies ChartConfig

// Fonction pour grouper les commissions par mois
const groupCommissionFixeByMonth = (commissionFixe: ICommission[]) => {
    // Structure initiale pour tous les mois avec valeur 0
    const mois = [
        { mois: 0, nom: "Jan", commission: 0 },
        { mois: 1, nom: "Fev", commission: 0 },
        { mois: 2, nom: "Mar", commission: 0 },
        { mois: 3, nom: "Avr", commission: 0 },
        { mois: 4, nom: "Mai", commission: 0 },
        { mois: 5, nom: "Jun", commission: 0 },
        { mois: 6, nom: "Jul", commission: 0 },
        { mois: 7, nom: "Aout", commission: 0 },
        { mois: 8, nom: "Sep", commission: 0 },
        { mois: 9, nom: "Oct", commission: 0 },
        { mois: 10, nom: "Nov", commission: 0 },
        { mois: 11, nom: "Dec", commission: 0 },
    ]

    // Parcourir toutes les commissions et les grouper par mois
    commissionFixe.forEach(commission => {
        try {
            const date = new Date(commission.createdAt)
            const month = date.getMonth() // 0-11 (Jan-Déc)
            
            if (month >= 0 && month <= 11) {
                mois[month].commission += commission.commission
            }
        } catch (error) {
            console.warn("Erreur de format de date:", commission.createdAt)
        }
    })

    return mois.map(m => ({ month: m.nom, commission: m.commission }))
}

export function CommissionMensuelleChart({ commissionFixe = [] }: CommissionMensuelleProps) {
    // Transformer les données des commissions en format pour le graphique
    const chartData = useMemo(() => {
        return groupCommissionFixeByMonth(commissionFixe)
    }, [commissionFixe])

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
                            domain={[0, maxCommission]}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <ChartTooltip
                            cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <defs>
                            <linearGradient id="commissionGradient" x1="0" y1="0" x2="0" y2="1">
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
                    <span>Commission mensuelle (FCFA)</span>
                    <span>Mois</span>
                </div>
                
                {/* Affichage des données réelles pour le débogage */}
                <div className="mt-4 text-xs text-gray-400">
                    <p>Total commission: {commissionFixe.reduce((sum, d) => sum + d.commission, 0).toLocaleString()} FCFA</p>
                    <p>Nombre de transactions: {commissionFixe.length}</p>
                </div>
            </div>
        </div>
    )
}