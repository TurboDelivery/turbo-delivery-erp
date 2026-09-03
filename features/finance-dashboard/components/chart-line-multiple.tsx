'use client';

import React, { useMemo, useState } from 'react';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts';
import { useDashboardStats } from '../hooks/use-dashboard-stats';
import { useFinanceResumeQuery } from '../queries/finance-resume.query';
import { YearFilter } from './year-filter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { createChartDot } from '../utils/chart.utils';

const chartConfig = {
  revenus: { label: 'Revenus', color: '#10b981' },
  depenses: { label: 'Dépenses', color: '#ef4444' },
  recouvrements: { label: 'Recouvrements', color: '#3b82f6' },
  investissements: { label: 'Investissements', color: '#f59e0b' },
  comptes: { label: 'En cours', color: '#8b5cf6' },
  // La marge est tracee plus epaisse et en dernier : c'est la lecture principale.
  marge: { label: 'Marge', color: '#111827' },
} satisfies ChartConfig;

const CHART_LINES = [
  { dataKey: 'revenus', color: chartConfig.revenus.color, epaisse: false },
  { dataKey: 'depenses', color: chartConfig.depenses.color, epaisse: false },
  { dataKey: 'recouvrements', color: chartConfig.recouvrements.color, epaisse: false },
  { dataKey: 'investissements', color: chartConfig.investissements.color, epaisse: false },
  { dataKey: 'comptes', color: chartConfig.comptes.color, epaisse: false },
  { dataKey: 'marge', color: chartConfig.marge.color, epaisse: true },
] as const;

export function ChartLineMultiple() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { chartData, isLoading, isError } = useDashboardStats(selectedYear);

  /**
   * La MARGE mensuelle, ajoutee au jeu de donnees.
   *
   * <p>Le graphique tracait cinq courbes — revenus, depenses, recouvrements,
   * investissements, encours — sans jamais montrer l'ecart entre les deux premieres. Or
   * c'est l'information la plus importante de la page : sur 2026, les depenses depassent
   * les revenus de janvier a mai, puis s'inversent nettement a partir de juin. Il fallait
   * comparer deux courbes a l'oeil pour le voir.</p>
   *
   * <p>Calculee ici plutot que demandee au backend : les deux termes sont deja dans la
   * reponse, une soustraction ne justifie pas un appel.</p>
   */
  const donneesAvecMarge = useMemo(
    () => (chartData ?? []).map((d: any) => ({ ...d, marge: (d.revenus ?? 0) - (d.depenses ?? 0) })),
    [chartData],
  );

  const { data: resume } = useFinanceResumeQuery({
    debut: new Date(selectedYear, 0, 1),
    fin: new Date(selectedYear, 11, 31),
  });

  const summaryCards = [
    { label: 'Revenus totaux', value: formatCFA(resume?.chiffreAffaire ?? 0), color: '#10b981', boldColor: '#047857' },
    { label: 'Dépenses totales', value: formatCFA(resume?.totalDepenses ?? 0), color: '#ef4444', boldColor: '#dc2626' },
    { label: 'Revenus encaissés', value: formatCFA(resume?.totalRevenus ?? 0), color: '#3b82f6', boldColor: '#2563eb' },
    { label: 'Investissements', value: formatCFA(resume?.totalInvestissements ?? 0), color: '#f59e0b', boldColor: '#d97706' },
    { label: 'Encours', value: formatCFA(resume?.totalFacturesEnCours ?? 0), color: '#8b5cf6', boldColor: '#7c3aed' },
  ];

  if (isError) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-danger">Erreur lors du chargement des statistiques</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="font-bold text-base sm:text-lg">Évolution financière mensuelle</h3>
          <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} isLoading={isLoading} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/*
          * Bande de totaux, RELIEE au graphique.
          *
          * <p>C'etaient cinq tuiles pastel — vert, rouge, bleu, ambre, violet — a fond
          * teinte, posees au-dessus d'un graphique dont les courbes portent EXACTEMENT ces
          * couleurs. La correspondance existait mais restait a deviner : deux langages
          * pour la meme information, et cinq aplats colores de plus sur une page qui en
          * comptait deja trop.</p>
          *
          * <p>Chaque total porte desormais la PASTILLE de sa courbe : le lien devient
          * explicite, le fond disparait, et les montants s'alignent en chasse tabulaire
          * pour se comparer.</p>
          */}
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 md:grid-cols-5">
          {summaryCards.map((card) => (
            <div key={card.label} className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: card.color }}
                />
                {card.label}
              </span>
              <span className="text-lg font-semibold leading-none tabular-nums">{card.value}</span>
            </div>
          ))}
        </div>

        {/* Graphique */}
        <div className="h-[260px] sm:h-[340px] md:h-[400px] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Chargement des statistiques...</p>
            </div>
          ) : donneesAvecMarge.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Aucun mouvement financier en {selectedYear}</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={donneesAvecMarge}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <ChartTooltip content={<ChartTooltipContent />} cursor={false} defaultIndex={1} />
                <Legend />
                {/* Les cinq courbes de detail sont fines ; la MARGE est plus epaisse et
                    sans point, pour se lire par-dessus sans encombrer. Toutes etaient a
                    `strokeWidth={3}` : cinq traits de meme poids, donc aucune lecture
                    principale. */}
                {CHART_LINES.map(({ dataKey, color, epaisse }) => (
                  <Line
                    key={dataKey}
                    activeDot={{ r: epaisse ? 5 : 6 }}
                    dataKey={dataKey}
                    dot={epaisse ? false : createChartDot(color)}
                    stroke={color}
                    strokeWidth={epaisse ? 2.5 : 1.8}
                    type="monotone"
                  />
                ))}
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
