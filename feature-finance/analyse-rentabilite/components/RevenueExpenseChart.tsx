'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { date: '1 mars', ca: 0, depenses: 0 },
  { date: '2 mars', ca: 80, depenses: 30 },
  { date: '3 mars', ca: 150, depenses: 55 },
  { date: '4 mars', ca: 220, depenses: 85 },
  { date: '5 mars', ca: 290, depenses: 115 },
  { date: '6 mars', ca: 350, depenses: 145 },
  { date: '7 mars', ca: 410, depenses: 180 },
  { date: '8 mars', ca: 460, depenses: 210 },
  { date: '10 mars', ca: 530, depenses: 260 },
  { date: '12 mars', ca: 600, depenses: 310 },
  { date: '14 mars', ca: 670, depenses: 365 },
  { date: '16 mars', ca: 740, depenses: 420 },
  { date: '18 mars', ca: 850, depenses: 500 },
  { date: '20 mars', ca: 890, depenses: 530 },
  { date: '22 mars', ca: 910, depenses: 545 },
  { date: '24 mars', ca: 940, depenses: 550 },
  { date: '25 mars', ca: 860, depenses: 550 },
  { date: '26 mars', ca: 850, depenses: 550 },
];

export default function RevenueExpenseChart() {
  return (
    <div className="w-full bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Évolution CA vs Dépenses
      </h2>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 50, bottom: 60 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={true}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              dy={10}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              axisLine={true}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              ticks={[0, 250, 500, 750, 1000]}
              dx={-10}
              label={{ value: 'FCFA (x1000)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: 12 } }}
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
            />
            <Line
              type="monotone"
              dataKey="ca"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#10b981' }}
              name="Chiffre d'Affaires"
            />
            <Line
              type="monotone"
              dataKey="depenses"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#ef4444' }}
              name="Dépenses Totales"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-gray-600">Chiffre d'Affaires</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600">Dépenses Totales</span>
        </div>
      </div>
    </div>
  );
}
