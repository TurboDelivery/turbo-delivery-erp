'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Trophy } from 'lucide-react';
import { IEncoursReleve, MOIS_COURTS, formatCompact, formatFcfa } from '@/features/encours';

const BRAND = '#F97316'; // orange Turbo
const BRAND_SOFT = '#FDBA74';

function ChartCard({
  title,
  icon: Icon,
  hasData,
  children,
}: {
  title: string;
  icon: typeof BarChart3;
  hasData: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card shadow="none" className="border border-default-200 bg-content1">
      <CardHeader className="flex items-center gap-2 pb-0 pt-3 text-sm font-semibold text-default-700">
        <Icon className="h-4 w-4 text-default-400" />
        {title}
      </CardHeader>
      <CardBody className="pt-2">
        {hasData ? (
          <div className="h-[180px] w-full">{children}</div>
        ) : (
          <div className="flex h-[180px] items-center justify-center text-sm text-default-400">
            Aucun reste à payer pour cette sélection.
          </div>
        )}
      </CardBody>
    </Card>
  );
}

const tooltipStyle = {
  contentStyle: { borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 },
  formatter: (value: number) => [formatFcfa(value), 'Reste'] as [string, string],
};

export function EncoursCharts({ releve }: { releve: IEncoursReleve }) {
  const moisData = (releve.moisColonnes ?? []).map((m) => ({
    mois: MOIS_COURTS[m] ?? `M${m}`,
    reste: releve.resteParMois?.[String(m)] ?? 0,
  }));

  const topData = [...(releve.partenaires ?? [])]
    .sort((a, b) => b.sousTotalReste - a.sousTotalReste)
    .slice(0, 6)
    .map((p) => ({ nom: p.groupe, reste: p.sousTotalReste }));

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <ChartCard title="Encours par mois" icon={BarChart3} hasData={moisData.length > 0}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={moisData} margin={{ top: 6, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F6" />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => formatCompact(v)}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip {...tooltipStyle} cursor={{ fill: '#F8722714' }} />
            <Bar dataKey="reste" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top partenaires par reste à payer" icon={Trophy} hasData={topData.length > 0}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topData}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F6" />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCompact(v)}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="nom"
              tick={{ fontSize: 11, fill: '#334155' }}
              axisLine={false}
              tickLine={false}
              width={108}
            />
            <Tooltip {...tooltipStyle} cursor={{ fill: '#F8722714' }} />
            <Bar dataKey="reste" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {topData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? BRAND : BRAND_SOFT} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
