"use client"

import { Bar, BarChart, XAxis } from "recharts"
import { useMemo } from "react"
import { format, startOfDay, endOfDay } from "date-fns"
import { fr } from "date-fns/locale"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useLivraisonList } from "@/feature-finance/revenus/hooks/use-livraison-list"
import { useDepensesListQuery } from "@/feature-finance/depenses/queries/depense-list.query"
import { useCommissionPourcentageList } from "@/feature-finance/revenus/hooks/use-commissionpourcentage-list"
import { useInvestissementList } from "@/feature-finance/revenus/hooks/use-investissement-list"

export const description = "A stacked bar chart with a legend"
export const iframeHeight = "600px"
export const containerClassName =
  "[&>div]:w-full [&>div]:max-w-md flex items-center justify-center min-h-svh"

const chartConfig = {
  revenus: {
    label: "Revenus",
    color: "#4CAF50",
  },
  depenses: {
    label: "Dépenses",
    color: "#EF4444",
  },
} satisfies ChartConfig

export function RepartitionTooltips() {
  // Récupération des données
  const { livraisons } = useLivraisonList({ initialData: [] })
  const { commissionspourcentage } = useCommissionPourcentageList({ initialData: [] })
  const { investissements } = useInvestissementList({ initialData: [] })
  const { data: depensesData } = useDepensesListQuery({
    page: 1,
    limit: 1000,
  })
  
  const depenses = depensesData?.content || []
  
  // Génération des données dynamiques pour les 12 derniers mois
  const chartData = useMemo(() => {
    const now = new Date()
    const months = 12
    const data = []

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = startOfDay(monthDate)
      const monthEnd = endOfDay(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0))

      const dateStr = format(monthDate, "yyyy-MM")

      // Revenus du mois
      const revenusMois = livraisons.reduce((total: number, livraison: any) => {
        const livraisonDate = new Date(livraison.createdAt)
        if (livraisonDate >= monthStart && livraisonDate <= monthEnd) {
          return total + (livraison.fraisLivraison || 0)
        }
        return total
      }, 0)

      // Commissions du mois
      const commissionsMois = commissionspourcentage.reduce((total: number, commission: any) => {
        const commissionDate = new Date(commission.createdAt)
        if (commissionDate >= monthStart && commissionDate <= monthEnd) {
          return total + (commission.commission || 0)
        }
        return total
      }, 0)

      // Investissements du mois
      const investissementsMois = investissements.reduce((total: number, investissement: any) => {
        const investissementDate = new Date(investissement.dateInvestissement)
        if (investissementDate >= monthStart && investissementDate <= monthEnd) {
          return total + (investissement.montant || 0)
        }
        return total
      }, 0)

      // Dépenses du mois
      const depensesMois = depenses.reduce((total: number, depense: any) => {
        const depenseDate = new Date(depense.createdAt)
        if (depenseDate >= monthStart && depenseDate <= monthEnd) {
          return total + (depense.montant || 0)
        }
        return total
      }, 0)

      const totalRevenus = revenusMois + commissionsMois + investissementsMois

      data.push({
        date: dateStr,
        revenus: totalRevenus,
        depenses: depensesMois,
        livraisons: revenusMois,
        commissions: commissionsMois,
        investissements: investissementsMois,
      })
    }

    return data
  }, [livraisons, commissionspourcentage, investissements, depenses])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Répartition des revenus et dépenses mensuelles</CardTitle>
        <CardDescription>
          Analyse des 12 derniers mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return new Date(value + "-01").toLocaleDateString("fr-FR", {
                  month: "short",
                  year: "numeric",
                })
              }}
            />
            <Bar
              dataKey="revenus"
              stackId="a"
              fill="#4CAF50"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="depenses"
              stackId="a"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="line" />}
              cursor={false}
              defaultIndex={1}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
