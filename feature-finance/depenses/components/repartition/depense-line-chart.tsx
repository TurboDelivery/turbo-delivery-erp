'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { cn } from '@/lib/utils';
import YearSelect from '@/components/commons/year-select';
import React from 'react';

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];
const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#22c55e',
  },
} satisfies ChartConfig;

export default function DepenseLineChart({ className }: { className?: string }) {
  const [year, setYear] = React.useState<string>(new Date().getFullYear().toString());


  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Evolution des dépenses</CardTitle>
          <CardDescription>Année {year}</CardDescription>
        </div>
        <YearSelect value={year} onChange={(newYear) => setYear(newYear)} />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Line
              dataKey="desktop"
              type="natural"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={{
                fill: 'var(--color-desktop)',
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
        <CardFooter>
          <div className="text-muted-foreground leading-none text-center mt-4 w-full">
            {/* Description */}
            L&#39;évolution des dépenses durant la periode choisie.
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
}
