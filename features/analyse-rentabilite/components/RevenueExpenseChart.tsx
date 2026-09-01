'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDailyStatsQuery } from '@/features/analyse-rentabilite/queries/daily-stats.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import EtatErreur from '@/components/commons/EtatErreur';

interface RevenueExpenseChartProps {
  debut?: Date;
  fin?: Date;
}

export default function RevenueExpenseChart({ debut, fin }: RevenueExpenseChartProps) {
  const { data: dailyStats, isLoading, isFetching, isError, refetch } = useDailyStatsQuery({ debut, fin });

  const data = React.useMemo(() => {
    if (!dailyStats) return [];

    return Object.entries(dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, values]) => ({
        date: new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        ca: Math.round(values.ca / 1000),
        depenses: Math.round(values.depenses / 1000),
      }));
  }, [dailyStats]);
  return (
    <div className="w-full bg-white rounded-lg p-4 sm:p-6 shadow-xs">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Évolution CA vs Dépenses
      </h2>
      
      <div className="h-[260px] sm:h-[340px] md:h-[400px] w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Chargement des données...</div>
          </div>
        ) : isError ? (
          /* Sur echec la courbe affichait « Aucun chiffre d'affaires ni depense sur
             la periode » : une journee d'activite normale passait pour une journee morte. */
          <div className="flex items-center justify-center h-full">
            <EtatErreur quoi="l'évolution CA et dépenses" onReessayer={() => refetch()} enCours={isFetching} />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Aucun chiffre d&apos;affaires ni dépense sur la période</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                height={50}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                width={55}
                tickFormatter={(value) => `${value}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                itemStyle={{
                  color: '#374151',
                  fontWeight: 500,
                }}
                formatter={(value: number) => [formatCFA(value * 1000), '']}
              />
              <Line
                type="monotone"
                dataKey="ca"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 5, fill: '#10b981' }}
                name="Chiffre d'Affaires"
              />
              <Line
                type="monotone"
                dataKey="depenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3, fill: '#ef4444' }}
                activeDot={{ r: 5, fill: '#ef4444' }}
                name="Dépenses Totales"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-gray-600">Chiffre d&#39;Affaires</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600">Dépenses Totales</span>
        </div>
      </div>
    </div>
  );
}
