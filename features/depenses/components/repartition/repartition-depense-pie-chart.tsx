'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Pie, PieChart } from 'recharts';
import { cn } from '@/lib/utils';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTopCategorieDepenseQuery } from '@/features/depenses/queries/category/top4-category-depense.query';
import { ITopCategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { useMemo } from 'react';

const COLORS = [
  '#e6194b', // rouge
  '#3cb44b', // vert
  '#ffe119', // jaune
  '#4363d8', // bleu
  '#f58231', // orange
  '#911eb4', // violet
  '#46f0f0', // cyan
  '#f032e6', // magenta
  '#bcf60c', // lime
  '#fabebe', // rose clair
];

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

interface RepartitionDepensePieChartProps {
  className?: string;
  debut?: Date;
  fin?: Date;
}

export default function RepartitionDepensePieChart({ className, debut: debutProp, fin: finProp }: RepartitionDepensePieChartProps) {
  const { filters } = useDepenseDashboardFilters();
  const debut = debutProp ?? filters.debut;
  const fin = finProp ?? filters.fin;
  const {
    data: categoriesDepense,
    isLoading,
    isError,
  } = useTopCategorieDepenseQuery({
    debut,
    fin,
    categorieIds: filters.categoriesDepense,
  });

  const chartData = useMemo(() => generateChartData(categoriesDepense || []), [categoriesDepense]);
  const chartConfig = useMemo(() => generateChartConfig(categoriesDepense || []), [categoriesDepense]);

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="items-center pb-0">
        <CardTitle>Répartition des dépenses</CardTitle>
        {debut && fin && (
          <CardDescription>
            {format(debut, 'd LLL y', { locale: fr })} - {format(fin, 'd LLL y', { locale: fr })}
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
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="montant" labelLine={false} nameKey="category" />
              {/*<ChartLegend content={<ChartLegendContent nameKey="category" />} className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center text-xs" />*/}
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">Aucune dépense sur la période</div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">Top 10 catégories</div>
        <div className="text-muted-foreground leading-none">Comment les dépenses sont distribuées entre les catégories.</div>
      </CardFooter>
    </Card>
  );
}

