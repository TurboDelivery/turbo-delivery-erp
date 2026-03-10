'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDepenseSummaryQuery } from '@/feature-finance/depenses/queries/depense-summary.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { TrendingUp } from 'lucide-react';

interface DepenseSummaryPieChartTableProps {
  className?: string;
  // Props pour utiliser les filtres du tableau
  debut?: Date;
  fin?: Date;
  categoriesDepense?: string[] | null;
}

export function DepenseSummaryPieChartTable({ 
  className, 
  debut, 
  fin, 
  categoriesDepense 
}: DepenseSummaryPieChartTableProps) {
  // ✅ Utiliser les filtres du tableau
  const currentSearchParams = {
    debut,
    fin,
    categoriesDepense: categoriesDepense || undefined,
  };

  const { data, isLoading, error } = useDepenseSummaryQuery(currentSearchParams);

  const COLORS = {
    recurrentes: '#10b981', // green-500
    nonRecurrentes: '#f59e0b', // amber-500
  };

  const dataForChart = data ? [
    {
      name: 'Récurrentes',
      value: data.totalRecurrentes,
      color: COLORS.recurrentes,
    },
    {
      name: 'Non Récurrentes',
      value: data.totalNonRecurrentes,
      color: COLORS.nonRecurrentes,
    },
  ] : [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
            {formatCFA(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Ne pas afficher si < 5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Répartition des Dépenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Répartition des Dépenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">Erreur lors du chargement des données</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.totalRecurrentes + data.totalNonRecurrentes;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Répartition des Dépenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataForChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                aria-label="Répartition des dépenses entre récurrentes et non récurrentes"
                role="img"
              >
                {dataForChart.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    aria-label={`${entry.name}: ${formatCFA(entry.value)}`}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value}: {formatCFA(entry.payload.value)}
                  </span>
                )}
                aria-label="Légende du graphique de répartition des dépenses"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Résumé des montants */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Récurrentes</p>
            <p className="text-lg font-bold text-green-700">
              {formatCFA(data.totalRecurrentes)}
            </p>
            <p className="text-xs text-green-600">
              {total > 0 ? ((data.totalRecurrentes / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-600 font-medium">Non Récurrentes</p>
            <p className="text-lg font-bold text-amber-700">
              {formatCFA(data.totalNonRecurrentes)}
            </p>
            <p className="text-xs text-amber-600">
              {total > 0 ? ((data.totalNonRecurrentes / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
