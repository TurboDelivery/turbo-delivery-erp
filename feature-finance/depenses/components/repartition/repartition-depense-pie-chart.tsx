'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Pie, PieChart } from 'recharts';
import { cn } from '@/lib/utils';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTop4CategorieDepenseQuery } from '@/feature-finance/depenses/queries/category/top4-category-depense.query';
import { ITopCategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { useMemo } from 'react';

const COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#06b6d4'];

function generateChartData(categoriesDepense: ITopCategorieDepense[]) {
  return categoriesDepense.map((cat, index) => ({
    category: cat.nom,
    montant: cat.totalmontant,
    fill: COLORS[index] || '#a855f7',
  }));
}

function generateChartConfig(categoriesDepense: ITopCategorieDepense[]): ChartConfig {
  const config: ChartConfig = {
    montant: { label: 'Montant' },
  };

  categoriesDepense.forEach((cat, index) => {
    config[cat.nom] = {
      label: cat.nom,
      color: COLORS[index] || '#a855f7',
    };
  });

  return config;
}

export default function RepartitionDepensePieChart({ className }: { className?: string }) {
  const { filters } = useDepenseDashboardFilters();
  const {
    data: categoriesDepense,
    isLoading,
    isError,
  } = useTop4CategorieDepenseQuery({
    debut: filters.debut,
    fin: filters.fin,
  });

  const chartData = useMemo(() => generateChartData(categoriesDepense || []), [categoriesDepense]);
  const chartConfig = useMemo(() => generateChartConfig(categoriesDepense || []), [categoriesDepense]);

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="items-center pb-0">
        <CardTitle>Répartition des dépenses</CardTitle>
        {filters.debut && filters.fin && (
          <CardDescription>
            {format(filters.debut, 'd LLL Y', { locale: fr })} - {format(filters.fin, 'd LLL Y', { locale: fr })}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-destructive">Erreur lors du chargement des données</div>
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square px-0">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="montant" hideLabel />} />
              <Pie
                data={chartData}
                dataKey="montant"
                labelLine={false}
                label={({ payload, ...props }) => {
                  return (
                    <text cx={props.cx} cy={props.cy} x={props.x} y={props.y} textAnchor={props.textAnchor} dominantBaseline={props.dominantBaseline} fill="hsla(var(--foreground))">
                      {payload.montant}
                    </text>
                  );
                }}
                nameKey="category"
              />
              <ChartLegend content={<ChartLegendContent nameKey="category" />} className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center text-xs" />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">Aucune donnée disponible</div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">Top 4 catégories</div>
        <div className="text-muted-foreground leading-none">Comment les dépenses sont distribuées entre les catégories.</div>
      </CardFooter>
    </Card>
  );
}
