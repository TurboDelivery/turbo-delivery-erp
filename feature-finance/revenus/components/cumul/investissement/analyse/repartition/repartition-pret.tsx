"use client"

import { Bar, BarChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { IInvestissement } from "@/feature-finance/revenus/types/revenus.types";

interface RepartitionPretProps {
    investissements?: IInvestissement[];
}

export const description = "Repartition des prêts"
export const iframeHeight = "600px"
export const containerClassName =
  "[&>div]:w-full [&>div]:max-w-md flex items-center justify-center min-h-svh"

const chartData = [
  { mois: "Jan", remboursé: 450, nonRemboursé: 300 },
  { mois: "Fév", remboursé: 380, nonRemboursé: 420 },
  { mois: "Mar", remboursé: 520, nonRemboursé: 120 },
  { mois: "Avr", remboursé: 140, nonRemboursé: 550 },
  { mois: "Mai", remboursé: 600, nonRemboursé: 350 },
  { mois: "Jui", remboursé: 480, nonRemboursé: 400 },
  { mois: "Juil", remboursé: 600, nonRemboursé: 350 },
  { mois: "Aoû", remboursé: 480, nonRemboursé: 400 },
  { mois: "Sep", remboursé: 600, nonRemboursé: 350 },
  { mois: "Oct", remboursé: 480, nonRemboursé: 400 },
  { mois: "Nov", remboursé: 600, nonRemboursé: 350 },
  { mois: "Déc", remboursé: 480, nonRemboursé: 400 },
]

const chartConfig = {
  remboursé: {
    label: "Remboursé",
    color: "#4CAF50",
  },
  nonRemboursé: {
    label: "Non remboursé",
    color: "#EF4444",
  },
} satisfies ChartConfig

export function RepartitionPret() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Repartition des prêts mensuelle</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis
              dataKey="mois"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={0}
              tickFormatter={(value) => value}
            />
            <Bar
              dataKey="remboursé"
              stackId="a"
              fill="#4CAF50"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="nonRemboursé"
              stackId="a"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="line" />}
              cursor={false}
            />
          </BarChart>
        </ChartContainer>
        <CardFooter>
          Montant(millions FCFA)
        </CardFooter>
      </CardContent>
    </Card>
  )
}