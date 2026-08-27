'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { cn } from '@/lib/utils';
import YearSelect from '@/components/commons/year-select';
import React, { useMemo } from 'react';
import { useDashboardStatsQuery } from '@/features/finance-dashboard/queries/dashboard-stats.query';
import { recupererDonnees } from '@/features/depenses/depense-stats.utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EtatErreur from '@/components/commons/EtatErreur';

const chartConfig = {
  montant: {
    label: 'Montant',
    color: '#ef4444',
  },
} satisfies ChartConfig;


export default function DepenseLineChart({ className }: { className?: string }) {
  const [year, setYear] = React.useState<string>(new Date().getFullYear().toString());
  const { data: dashboardStats, isLoading, isFetching, isError, refetch } = useDashboardStatsQuery({ annee: parseInt(year) });

  const depenseData = useMemo(() => {
    if (!dashboardStats) return [];
    return recupererDonnees(dashboardStats, 'depenses', parseInt(year));
  }, [dashboardStats, year]);

  const chartData = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentYear = new Date().getFullYear();
    const selectedYear = parseInt(year);

    // Filtrer uniquement jusqu'au mois actuel si l'année sélectionnée est l'année courante
    const filteredData = depenseData.filter((item) => {
      const itemDate = new Date(item.date);
      const itemMonth = itemDate.getMonth() + 1;

      if (selectedYear === currentYear) {
        return itemMonth <= currentMonth;
      }
      return true;
    });

    return filteredData.map((item) => {
      const itemDate = new Date(item.date);

      return {
        month: format(itemDate, 'MMM', { locale: fr }),
        montant: item.data.montant,
        count: item.data.count,
      };
    });
  }, [depenseData, year]);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Evolution des dépenses</CardTitle>
          <CardDescription>Année {year}</CardDescription>
        </div>
        <YearSelect value={year} onChange={(newYear) => setYear(newYear)} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        ) : isError ? (
          /* Sans donnee, la courbe tombait sur « Aucune depense sur la periode » :
             une annee illisible se lisait comme une annee sans depense. */
          <div className="flex items-center justify-center h-[300px]">
            <EtatErreur quoi="l'évolution des dépenses" onReessayer={() => refetch()} enCours={isFetching} />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Line
                dataKey="montant"
                type="linear"
                stroke="var(--color-montant)"
                strokeWidth={2}
                dot={{
                  fill: 'var(--color-montant)',
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">Aucune dépense sur la période</div>
          </div>
        )}
        <CardFooter>
          <div className="text-muted-foreground leading-none text-center mt-4 w-full">
            {/* Description */}
            L&#39;évolution des dépenses durant la période choisie.
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

