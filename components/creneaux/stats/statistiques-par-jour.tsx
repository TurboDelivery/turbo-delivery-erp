'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { IStatistiqueJour } from '@/features/creneaux/types/creneau.types';
import { getJourLabel } from '@/features/creneaux/utils/semaine.utils';

interface StatistiquesParJourProps {
  data: IStatistiqueJour[];
}

const chartConfig = {
  pourcentage: {
    label: 'Presence',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

function JourStatItem({ item }: { item: IStatistiqueJour }) {
  const bgColor = item.pourcentage >= 80
    ? 'bg-green-50'
    : item.pourcentage >= 50
      ? 'bg-orange-50'
      : 'bg-red-50';

  const textColor = item.pourcentage >= 80
    ? 'text-green-700'
    : item.pourcentage >= 50
      ? 'text-orange-700'
      : 'text-red-700';

  return (
    <div className={`flex items-center justify-between rounded-lg p-3 ${bgColor}`}>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{getJourLabel(item.jour)} {new Date(item.date).getDate()}</span>
        <span className="text-xs text-default-500">
          Presents: {item.presents}/{item.total}
        </span>
      </div>
      <span className={`text-xl font-bold ${textColor}`}>{item.pourcentage}%</span>
    </div>
  );
}

export function StatistiquesParJour({ data }: StatistiquesParJourProps) {
  const chartData = data.map((item) => ({
    jour: getJourLabel(item.jour).slice(0, 3),
    pourcentage: item.pourcentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Statistiques par jour</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((item) => (
          <JourStatItem key={item.jour} item={item} />
        ))}

        {data.length > 0 && (
          <div className="pt-4">
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="jour" width={40} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pourcentage" fill="var(--color-pourcentage)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
