'use client';

import { IDepense } from '../../types/depense.type';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Pie, PieChart } from 'recharts';
import { cn } from '@/lib/utils';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const chartData = [
  { browser: 'chrome', visitors: 275, fill: '#4f46e5' },
  { browser: 'safari', visitors: 200, fill: '#22c55e' },
  { browser: 'firefox', visitors: 187, fill: '#f59e0b' },
  { browser: 'edge', visitors: 173, fill: '#06b6d4' },
  { browser: 'other', visitors: 90, fill: '#a855f7' },
];

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  chrome: {
    label: 'Chrome',
    color: '#4f46e5',
  },
  safari: {
    label: 'Safari',
    color: '#22c55e',
  },
  firefox: {
    label: 'Firefox',
    color: '#f59e0b',
  },
  edge: {
    label: 'Edge',
    color: '#06b6d4',
  },
  other: {
    label: 'Other',
    color: '#a855f7',
  },
} satisfies ChartConfig;

export default function RepartitionDepensePieChart({ className }: { className?: string }) {
  const {
    filters
  } = useDepenseDashboardFilters();
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="items-center pb-0">
        <CardTitle>Répartition des dépenses</CardTitle>
        <CardDescription>
          {format(filters.debut, 'd LLL', { locale: fr })} - {format(filters.fin, 'd LLL Y', { locale: fr })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square px-0">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="visitors" hideLabel />} />
            <Pie
              data={chartData}
              dataKey="visitors"
              labelLine={false}
              label={({ payload, ...props }) => {
                return (
                  <text cx={props.cx} cy={props.cy} x={props.x} y={props.y} textAnchor={props.textAnchor} dominantBaseline={props.dominantBaseline} fill="hsla(var(--foreground))">
                    {payload.visitors}
                  </text>
                );
              }}
              nameKey="depenses"
            />
            <ChartLegend content={<ChartLegendContent nameKey="browser" />} className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">Top 5 catégories</div>
        <div className="text-muted-foreground leading-none">Comment les dépenses sont distribuées entre les catégories.</div>
      </CardFooter>
    </Card>
  );
}
