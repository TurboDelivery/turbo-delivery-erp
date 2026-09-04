'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useInvestissementMonthlyFilters, useInvestissementStatsMonthly } from '@/features/investissement/hooks';
import { format, getMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectItem } from '@/components/heroui';
import EtatErreur from '@/components/commons/EtatErreur';

const chartConfig = {
  montantInvestissement: {
    label: 'Investissement',
    color: '#3B82F6', // Bleu
  },
  montantRembourse: {
    label: 'Remboursement',
    color: '#10B981', // Vert
  },
} satisfies ChartConfig;

// Générer la liste des années de 2025 à aujourd'hui
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2025; year <= currentYear; year++) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
};

// Générer tous les mois de l'année jusqu'au mois actuel
const generateCompleteMonthlyData = (data: any[], selectedYear: string) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = getMonth(new Date()); // 0-11
  const isCurrentYear = parseInt(selectedYear) === currentYear;

  // Déterminer le dernier mois à afficher
  const lastMonth = isCurrentYear ? currentMonth : 11;

  // Créer un tableau avec tous les mois
  const allMonths = [];
  for (let month = 0; month <= lastMonth; month++) {
    const date = new Date(parseInt(selectedYear), month, 1);
    const monthKey = format(date, 'yyyy-MM-01');

    // Chercher les données correspondantes
    const existingData = data?.find((item) => item.date.startsWith(format(date, 'yyyy-MM')));

    allMonths.push({
      month: format(date, 'MMMM', { locale: fr }),
      montantInvestissement: existingData?.montantInvestissement || 0,
      montantRembourse: existingData?.montantRembourse || 0,
    });
  }

  return allMonths;
};

export function InvestissementMonthlyChart() {
  const { data, isLoading, isFetching, isError, refetch } = useInvestissementStatsMonthly();
  const { year, updateYear } = useInvestissementMonthlyFilters();

  const years = generateYears();

  // Générer les données complètes avec tous les mois jusqu'au mois actuel
  const chartData = generateCompleteMonthlyData(data || [], year);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-surface-tertiary rounded w-64 animate-pulse mb-2" />
          <div className="h-4 bg-surface-tertiary rounded w-48 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-surface-tertiary rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition Mensuelle - Investissements & Remboursements</CardTitle>
        <CardDescription>Visualisation des investissements et remboursements par mois</CardDescription>
        <div className="mt-4 max-w-xs">
          <Select
            label="Année"
            placeholder="Sélectionner une année"
            selectedKeys={new Set([year])}
            onSelectionChange={(keys) => {
              const selectedYear = Array.from(keys)[0] as string;
              if (selectedYear) {
                updateYear(selectedYear);
              }
            }}
            className="w-full"
          >
            {years.map((yearItem) => (
              <SelectItem key={yearItem.value} value={yearItem.value}>
                {yearItem.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* `generateCompleteMonthlyData` fabrique douze mois a zero quand il n'a pas
            de donnee : le graphe restait dessine, plat, et personne ne voyait l'echec. */}
        {isError ? (
          <EtatErreur quoi="la répartition mensuelle" onReessayer={() => refetch()} enCours={isFetching} />
        ) : (
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="montantInvestissement" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
            <Bar dataKey="montantRembourse" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium text-muted-foreground">Données pour l&#39;année {year}</div>
      </CardFooter>
    </Card>
  );
}

// Alias pour la compatibilité avec les imports existants
export default InvestissementMonthlyChart;
