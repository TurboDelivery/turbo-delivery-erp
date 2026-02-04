"use client"

import { useState, useMemo } from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Calendar } from "lucide-react"
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

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
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { DateRange } from 'react-day-picker'
import { useInvestissementStats } from '@/feature-finance/revenus/hooks/use-investissement-stats'

export const description = "Repartition des prêts"
export const iframeHeight = "600px"
export const containerClassName =
  "[&>div]:w-full [&>div]:max-w-md flex items-center justify-center min-h-svh"

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fonction pour gérer le changement de plage de dates
  const handleDateRangeChange = (value: DateRange | undefined) => {
    setDateRange(value);
  };

  // Préparer les paramètres pour l'API
  const apiParams = useMemo(() => {
    const params: { startDate?: string; endDate?: string } = {};
    if (dateRange?.from) {
      params.startDate = dateRange.from.toISOString().split('T')[0];
    }
    if (dateRange?.to) {
      params.endDate = dateRange.to.toISOString().split('T')[0];
    }
    return params;
  }, [dateRange]);

  const { investissementStats, isLoading, isError, error } = useInvestissementStats(apiParams);

  // Transformer les données de l'API pour le graphique
  const chartData = useMemo(() => {
    if (!investissementStats?.monthlyData) {
      return [];
    }

    return investissementStats.monthlyData.map((item: { date: string; montantInvestissement: number; montantRembourse: number }) => {
      const date = new Date(item.date);
      const monthName = format(date, 'MMM', { locale: fr });
      
      return {
        mois: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        remboursé: item.montantRembourse || 0.01, // Ajouter une petite valeur pour la visibilité
        nonRemboursé: item.montantInvestissement - item.montantRembourse,
        total: item.montantInvestissement
      };
    });
  }, [investissementStats]);

  // Formatage pour l'affichage des montants
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`; // Convertir en millions pour les grands montants
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`; // Convertir en milliers pour les montants moyens
    } else {
      return `${value.toLocaleString('fr-FR')} FCFA`; // Afficher en FCFA pour les petits montants
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">Repartition des prêts mensuelle</CardTitle>
          
          {/* Filtre de plage de dates */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" data-empty={!dateRange?.from || !dateRange?.to} className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal">
                <Calendar />
                {dateRange?.from && dateRange?.to ? (
                  <span className="ml-2">
                    {format(new Date(dateRange.from), 'dd/MM/yyyy')} - {format(new Date(dateRange.to), 'dd/MM/yyyy')}
                  </span>
                ) : (
                  <span className="ml-2">Sélectionner une plage de dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-gray-500">Chargement des données...</div>
          </div>
        ) : isError ? (
          <div className="h-[400px] flex flex-col items-center justify-center">
            <div className="text-red-500 mb-2">Erreur lors du chargement des données</div>
            {error && typeof error === 'object' && error !== null ? (
              <div className="text-sm text-red-400 text-center max-w-md">
                {error instanceof Error ? error.message : String(error)}
              </div>
            ) : error ? (
              <div className="text-sm text-red-400 text-center max-w-md">
                {String(error)}
              </div>
            ) : null}
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-gray-500">Aucune donnée disponible pour cette période</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="mois"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  interval={0}
                  tickFormatter={(value) => value}
                />
                <YAxis
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  content={<ChartTooltipContent indicator="line" />}
                  cursor={false}
                  formatter={(value: number) => [formatCurrency(value), ""]}
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
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>Montant (FCFA)</div>
        {investissementStats && (
          <div className="text-sm text-gray-600">
            Total: {formatCurrency(investissementStats.totalInvestissement)} | 
            Restant: {formatCurrency(investissementStats.montantRestant)}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}