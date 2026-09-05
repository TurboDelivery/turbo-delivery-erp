'use client';

import { Card } from '@heroui-v3/react';
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

/*
 * Les couleurs des graphiques passent par les VARIABLES du theme et non par des
 * hexadecimaux. Elles etaient ecrites en dur — `#F97316` pour les barres, `#EEF2F6` pour
 * la grille, `#64748B` pour les graduations : en theme sombre, une grille gris tres clair
 * sur un fond noir, et un orange qui n'est plus la couleur de marque du projet.
 * Recharts pose ces valeurs en attributs SVG, ou `var(--x)` est valide.
 */
const BARRE = 'var(--accent)';
const BARRE_DOUCE = 'color-mix(in oklab, var(--accent) 45%, transparent)';
const GRILLE = 'var(--separator)';
const GRADUATION = 'var(--muted-foreground, var(--muted))';

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
    <Card>
      <Card.Content className="gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon aria-hidden="true" className="size-4 text-muted" />
          {title}
        </span>
        {hasData ? (
          <div className="h-[180px] w-full">{children}</div>
        ) : (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted">
            Aucun reste à payer pour cette sélection.
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--separator)',
    borderRadius: 8,
    color: 'var(--foreground)',
    fontSize: 12,
  },
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRILLE} />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: GRADUATION }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => formatCompact(v)}
              tick={{ fontSize: 11, fill: GRADUATION }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip {...tooltipStyle} cursor={{ fill: 'color-mix(in oklab, var(--accent) 8%, transparent)' }} />
            <Bar dataKey="reste" fill={BARRE} radius={[4, 4, 0, 0]} maxBarSize={48} />
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
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRILLE} />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCompact(v)}
              tick={{ fontSize: 11, fill: GRADUATION }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="nom"
              tick={{ fontSize: 11, fill: 'var(--foreground)' }}
              axisLine={false}
              tickLine={false}
              width={108}
            />
            <Tooltip {...tooltipStyle} cursor={{ fill: 'color-mix(in oklab, var(--accent) 8%, transparent)' }} />
            <Bar dataKey="reste" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {topData.map((_, i) => (
                <Cell key={topData[i].nom} fill={i === 0 ? BARRE : BARRE_DOUCE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
