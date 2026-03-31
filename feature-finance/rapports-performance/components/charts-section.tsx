'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardBody } from '@heroui/react';
import {
  IGeographicLocation,
  IWeeklyActivity,
} from '@/feature-finance/rapports-performance/types/performance.type';

interface ChartsSectionProps {
  geographicData: IGeographicLocation[];
  weeklyActivityData: IWeeklyActivity[];
}

const DONUT_COLORS = [
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#EAB308', // yellow-500
  '#22C55E', // green-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#06B6D4', // cyan-500
  '#F43F5E', // rose-500
  '#84CC16', // lime-500
  '#A855F7', // purple-500
  '#F59E0B', // amber-500
  '#10B981', // emerald-500
  '#6366F1', // indigo-500
  '#0EA5E9', // sky-500
  '#D946EF', // fuchsia-500
  '#FB7185', // rose-400
  '#34D399', // emerald-400
  '#60A5FA', // blue-400
];

export function ChartsSection({ geographicData, weeklyActivityData }: ChartsSectionProps) {
  const renderDonutChart = () => (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={geographicData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
        >
          {geographicData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={weeklyActivityData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickFormatter={(value) => `${(value / 100000).toFixed(0)}k`}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Bar dataKey="deliveries" fill="#EF4444" name="Livraisons" radius={[4, 4, 0, 0]} />
        <Bar dataKey="revenue" fill="#F97316" name="Chiffre d'affaires (FCFA)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardBody className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Répartition Géographique</h2>
            <p className="text-sm text-gray-500">
              Zone Top: {geographicData[0]?.name ?? 'N/A'} ({geographicData[0]?.deliveries ?? 0} livraisons)
            </p>
          </div>
          {renderDonutChart()}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pics d'Activité Hebdomadaire</h2>
            <p className="text-sm text-gray-500">
              Jour de Pic: <span className="font-medium">Dimanche</span> - 55% des livraisons vers Marcory
            </p>
          </div>
          {renderBarChart()}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Livraisons</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Chiffre d'affaires (FCFA)</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
