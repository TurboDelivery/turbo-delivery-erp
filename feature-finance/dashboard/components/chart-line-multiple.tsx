"use client"

import React, { useState } from "react"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { useDashboardStats } from "../hooks/use-dashboard-stats"
import { YearFilter } from "./year-filter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Solution de secours pour le formatage des montants
const formatMontantLocal = (montant: number): string => {
    if (montant === 0) return "0 FCFA";
    
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(montant);
}

export const description = "Évolution financière mensuelle"

const chartConfig = {
    revenus: {
        label: "Revenus",
        color: "#10b981", // Vert émeraude
    },
    depenses: {
        label: "Dépenses",
        color: "#ef4444", // Rouge vif
    },
    recouvrements: {
        label: "Recouvrements",
        color: "#3b82f6", // Bleu vif
    },
    investissements: {
        label: "Investissements",
        color: "#f59e0b", // Orange ambre
    },
    comptes: {
        label: "Comptes",
        color: "#8b5cf6", // Violet
    },
} satisfies ChartConfig

export function ChartLineMultiple() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const { chartData, yearlyTotals, isLoading, isError } = useDashboardStats(selectedYear)

    if (isError) {
        return (
            <Card className="shadow-lg border-0">
                <CardContent className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                        <p className="text-red-500">Erreur lors du chargement des statistiques</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-lg border-0">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">Évolution financière mensuelle</h3>
                        <p className="text-sm text-muted-foreground">
                            Année {selectedYear}
                        </p>
                    </div>
                    <YearFilter 
                        selectedYear={selectedYear}
                        onYearChange={setSelectedYear}
                        isLoading={isLoading}
                    />
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Cartes de résumé */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: "#10b98120" }}>
                        <p className="text-sm font-medium" style={{ color: "#10b981" }}>Revenus totaux</p>
                        <p className="text-xl font-bold" style={{ color: "#047857" }}>
                            {formatMontantLocal(yearlyTotals.totalRevenus)}
                        </p>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: "#ef444420" }}>
                        <p className="text-sm font-medium" style={{ color: "#ef4444" }}>Dépenses totales</p>
                        <p className="text-xl font-bold" style={{ color: "#dc2626" }}>
                            {formatMontantLocal(yearlyTotals.totalDepenses)}
                        </p>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: "#3b82f620" }}>
                        <p className="text-sm font-medium" style={{ color: "#3b82f6" }}>Recouvrements</p>
                        <p className="text-xl font-bold" style={{ color: "#2563eb" }}>
                            {formatMontantLocal(yearlyTotals.totalRecouvrements)}
                        </p>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: "#f59e0b20" }}>
                        <p className="text-sm font-medium" style={{ color: "#f59e0b" }}>Investissements</p>
                        <p className="text-xl font-bold" style={{ color: "#d97706" }}>
                            {formatMontantLocal(yearlyTotals.totalInvestissements)}
                        </p>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: "#8b5cf620" }}>
                        <p className="text-sm font-medium" style={{ color: "#8b5cf6" }}>Solde comptes</p>
                        <p className="text-xl font-bold" style={{ color: "#7c3aed" }}>
                            {formatMontantLocal(yearlyTotals.totalComptes)}
                        </p>
                    </div>
                </div>

                {/* Graphique */}
                <div className="h-[400px] w-full">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p>Chargement des statistiques...</p>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">Aucune donnée disponible pour {selectedYear}</p>
                        </div>
                    ) : (
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="month" 
                                    tick={{ fontSize: 12 }}
                                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                />
                                <ChartTooltip 
                                    content={<ChartTooltipContent />}
                                    labelFormatter={(label) => `Mois: ${label}`}
                                    formatter={(value: number, name: string) => [
                                        formatMontantLocal(value),
                                        chartConfig[name as keyof typeof chartConfig]?.label || name
                                    ]}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenus"
                                    stroke={chartConfig.revenus.color}
                                    strokeWidth={3}
                                    dot={{ fill: chartConfig.revenus.color, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="depenses"
                                    stroke={chartConfig.depenses.color}
                                    strokeWidth={3}
                                    dot={{ fill: chartConfig.depenses.color, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="recouvrements"
                                    stroke={chartConfig.recouvrements.color}
                                    strokeWidth={3}
                                    dot={{ fill: chartConfig.recouvrements.color, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="investissements"
                                    stroke={chartConfig.investissements.color}
                                    strokeWidth={3}
                                    dot={{ fill: chartConfig.investissements.color, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="comptes"
                                    stroke={chartConfig.comptes.color}
                                    strokeWidth={3}
                                    dot={{ fill: chartConfig.comptes.color, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}