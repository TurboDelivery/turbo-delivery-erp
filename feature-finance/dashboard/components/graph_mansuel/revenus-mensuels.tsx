"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "Revenus mensuels"

const chartData = [
    { month: "Jan", revenus: 50 },
    { month: "Fev", revenus: 30 },
    { month: "Mar", revenus: 20 },
    { month: "Avr", revenus: 70 },
    { month: "Mai", revenus: 20 },
    { month: "Jun", revenus: 20 },
    { month: "Jul", revenus: 10 },
    { month: "Aout", revenus: 20 },
    { month: "Sep", revenus: 20 },
    { month: "Oct", revenus: 10 },
    { month: "Nov", revenus: 20 },
    { month: "Dec", revenus: 20 },
]

const chartConfig = {
    revenus: {
        label: "Revenus",
        color: "hsl(142, 75.20%, 44.30%)", 
    },
} satisfies ChartConfig

export function RevenusChart() {
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
                                domain={[0, 'dataMax + 2']}
                                tick={{ fontSize: 12, fill: "#6b7280" }}
                            />
                            <ChartTooltip
                                cursor={{ stroke: "#d1d5db", strokeWidth: 1 }}
                                content={<ChartTooltipContent indicator="line" />}
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
                        <span>Revenus mensuels(millions)</span>
                        <span>Mois</span>
                    </div>
                </div>
            </div>
        )
    }