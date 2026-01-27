"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "Évolution financière mensuelle"

const chartData = [
  { month: "Jan", revenus: 4000, depenses: 2400, comptes: 1600 },
  { month: "Fév", revenus: 3000, depenses: 1398, comptes: 3202 },
  { month: "Mar", revenus: 5000, depenses: 2800, comptes: 5402 },
  { month: "Avr", revenus: 4500, depenses: 3200, comptes: 6702 },
  { month: "Mai", revenus: 5200, depenses: 3000, comptes: 8902 },
  { month: "Juin", revenus: 4800, depenses: 3500, comptes: 10202 },
  { month: "Juil", revenus: 5300, depenses: 3300, comptes: 12202 },
  { month: "Août", revenus: 4900, depenses: 3100, comptes: 14002 },
  { month: "Sept", revenus: 5500, depenses: 3600, comptes: 15902 },
  { month: "Oct", revenus: 6000, depenses: 4000, comptes: 17902 },
  { month: "Nov", revenus: 5800, depenses: 3700, comptes: 19902 },
  { month: "Déc", revenus: 6500, depenses: 4200, comptes: 22202 },
]

const chartConfig = {
  revenus: {
    label: "Revenus",
    color: "#10b981", // vert
  },
  depenses: {
    label: "Dépenses",
    color: "#ef4444", // rouge
  },
  comptes: {
    label: "Solde Comptes",
    color: "#3b82f6", // bleu
  },
} satisfies ChartConfig

export function ChartLineMultiple() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Évolution Financière</CardTitle>
        <CardDescription>Janvier - Décembre 2025</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12, top: 20, bottom: 20 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <YAxis tickLine={false} axisLine={false} tickMargin={8} />

            <Legend 
              verticalAlign="top" 
              height={50}
              iconType="line"
              wrapperStyle={{
                fontSize: '16px',
                fontWeight: '500'
              }}
            />

            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            {/* Revenus */}
            <Line
              dataKey="revenus"
              type="monotone"
              stroke={chartConfig.revenus.color}
              strokeWidth={3}
              dot={{ fill: chartConfig.revenus.color, r: 2 }}
              activeDot={{ r: 3 }}
            />

            {/* Dépenses */}
            <Line
              dataKey="depenses"
              type="monotone"
              stroke={chartConfig.depenses.color}
              strokeWidth={3}
              dot={{ fill: chartConfig.depenses.color, r: 2 }}
              activeDot={{ r: 3 }}
            />

            {/* Solde comptes */}
            <Line
              dataKey="comptes"
              type="monotone"
              stroke={chartConfig.comptes.color}
              strokeWidth={4}
              dot={{ fill: chartConfig.comptes.color, r: 2 }}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Solde en croissance <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}