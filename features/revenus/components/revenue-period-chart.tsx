'use client';

import { useMemo, useState } from 'react';
import { formatMontant } from '@/utils/format.utils';
import { Card } from '@/components/ui/card';
import { ArrowRight, BarChart3, Calendar, DollarSign } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useRevenuePeriod } from '../hooks/use-revenue-period';
import { startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import DateFilterInput from '@/components/finance/date-filter-input';
import EtatErreur from '@/components/commons/EtatErreur';

type Period = 'WEEK' | 'MONTH';

interface RevenueData {
  label: string;
  value: number;
  date?: string | null;
  month?: number | null;
}

interface RevenueResponse {
  period: string;
  date?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  currency: string;
  data: RevenueData[];
  statistics: {
    total: number;
    average: number;
    max: number;
    min: number;
    deliveriesCount: number;
    averagePerDelivery: number;
  };
  breakdown: {
    deliveryFees: number;
    tips: number;
    totalRevenue: number;
  };
  comparison?: {
    previous: number;
    changePercentage: number;
    trend: 'up' | 'down';
  } | null;
}

const periodLabels = {
  WEEK: 'Semaine',
  MONTH: 'Mois',
};

export default function RevenuePeriodChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('MONTH');

  // État pour le filtre par plage de dates
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // Toujours utiliser le mois actuel si pas de plage personnalisée
  const currentMonth = new Date();
  const apiDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : currentMonth.toISOString().split('T')[0];

  const { revenueData, monthlyChartData, isLoading, isError, error } = useRevenuePeriod({
    period: selectedPeriod,
    date: apiDate,
    startDate: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
    endDate: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined,
    initialData: null,
  });

  // Affichait le CODE devise brut de l'API (« 1 500 XOF »), là où le reste de l'ERP
  // écrit « 1 500 FCFA ». Un même montant changeait donc de devise d'un écran à l'autre.
  const formatCurrency = (value: number) => formatMontant(value);

  // Utiliser directement les statistiques de l'API
  const stats = revenueData?.statistics;

  // Récupérer les données YEAR pour la comparaison mensuelle
  // `isError` etait jete : quand la requete YEAR tombait, `yearData` restait null, le
  // useMemo ci-dessous sortait a null, et le bloc « Comparaison mensuelle » DISPARAISSAIT
  // de la page — sans squelette, sans message, le reste de l'ecran restant normal. Rien
  // ne distinguait une panne d'une periode sans historique.
  const { revenueData: yearData, isError: isYearError, refetch: refetchYear } = useRevenuePeriod({
    period: 'YEAR',
    date: undefined,
    startDate: undefined,
    endDate: undefined,
    initialData: null,
  });

  // Calculer la comparaison entre mois en cours et mois passé
  const monthlyComparison = useMemo(() => {
    if (!yearData?.data || yearData.data.length === 0) {
      return null;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const currentYear = currentDate.getFullYear();
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Trouver les données du mois en cours et du mois passé
    const currentMonthData = yearData.data.find((item) => {
      return item.month === currentMonth;
    });

    const previousMonthData = yearData.data.find((item) => {
      return item.month === previousMonth;
    });

    if (!currentMonthData || !previousMonthData) {
      return null;
    }

    const currentRevenue = currentMonthData.value || 0;
    const previousRevenue = previousMonthData.value || 0;
    const change = currentRevenue - previousRevenue;
    const changePercentage = previousRevenue > 0 ? (change / previousRevenue) * 100 : 0;

    return {
      currentMonth: {
        name: new Date(currentYear, currentMonth - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        revenue: currentRevenue,
      },
      previousMonth: {
        name: new Date(previousYear, previousMonth - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        revenue: previousRevenue,
      },
      change,
      changePercentage: Math.abs(changePercentage),
    };
  }, [yearData]);

  const getPeriodDisplay = () => {
    if (!revenueData) return '';

    // Si une plage personnalisée est sélectionnée, l'afficher en priorité
    if (dateRange?.from && dateRange?.to) {
      const start = new Date(dateRange.from);
      const end = new Date(dateRange.to);
      return `Période du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
    }

    // Sinon, utiliser les données de l'API
    switch (revenueData.period) {
      case 'week':
        if (revenueData.startDate && revenueData.endDate) {
          const start = new Date(revenueData.startDate);
          const end = new Date(revenueData.endDate);
          return `Semaine du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
        }
        return 'Cette semaine';
      case 'month':
        return `Mois de ${currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
      default:
        return '';
    }
  };

  // Utiliser les données mensuelles pour le graphique (toujours le mois complet)
  const chartData = monthlyChartData?.data || revenueData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Erreur lors du chargement des données: {error instanceof Error ? error.message : 'Erreur inconnue'}</p>
        </div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600">Aucun revenu sur cette période</p>
        </div>

        {/* Section de debugging pour les plages personnalisées */}
        {dateRange && (
          <Card className="p-4 bg-gray-50 border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Informations de debugging</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <strong>Période sélectionnée:</strong> {selectedPeriod}
              </p>
              <p>
                <strong>Date début:</strong> {dateRange.from?.toISOString().split('T')[0]}
              </p>
              <p>
                <strong>Date fin:</strong> {dateRange.to?.toISOString().split('T')[0]}
              </p>
              <p>
                <strong>Jours:</strong> {dateRange.from && dateRange.to ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) : 0}
              </p>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de période */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <h2 className="text-2xl font-bold text-primary">Revenus par période</h2>

        {/* Sélecteur de plage de dates */}
        <DateFilterInput
          filters={{
            debut: dateRange?.from,
            fin: dateRange?.to,
          }}
          handleDateChange={setDateRange}
        />
      </div>

      {/* Message d'information si aucune donnée */}
      {(!revenueData?.data || revenueData.data.length === 0) && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-yellow-600" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">Aucun revenu</h4>
              <p className="text-xs text-yellow-600">Il n&#39;y a pas de revenus enregistrés pour cette période.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Graphique des revenus */}
      <Card className="p-6 bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-800">Revenu {periodLabels[selectedPeriod]}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{getPeriodDisplay()}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-red-600">{formatCurrency(stats?.total || 0)}</p>
            </div>
          </div>
          <div className="p-3 bg-red-200 rounded-full">
            <DollarSign className="w-6 h-6 text-red-700" />
          </div>
        </div>

        {/* Statistiques additionnelles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-red-200">
          <div>
            <p className="text-xs text-gray-600">Moyenne</p>
            <p className="text-sm font-semibold text-gray-800">{formatCurrency(stats?.average || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Maximum</p>
            <p className="text-sm font-semibold text-gray-800">{formatCurrency(stats?.max || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Livraisons</p>
            <p className="text-sm font-semibold text-gray-800">{stats?.deliveriesCount || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Moyenne/Livraison</p>
            <p className="text-sm font-semibold text-gray-800">{formatCurrency(stats?.averagePerDelivery || 0)}</p>
          </div>
        </div>
      </Card>

      {/* Graphique */}
      <Card className="p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Évolution des revenus - Mois de {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Revenu']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Line type="monotone" dataKey="value" stroke="#dc2626" strokeWidth={3} dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#ffe246' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Carte de comparaison mensuelle */}
      {isYearError && (
        <Card className="p-6 border-gray-200 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">Comparaison mensuelle</h3>
          </div>
          <EtatErreur
            quoi="la comparaison mensuelle"
            onReessayer={() => refetchYear()}
          />
        </Card>
      )}

      {!isYearError && monthlyComparison && (
        <Card className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">Comparaison mensuelle</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mois précédent */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Mois précédent</p>
              <p className="text-xs text-gray-500 mb-2">{monthlyComparison.previousMonth.name}</p>
              <p className="text-2xl font-bold text-gray-700">{formatCurrency(monthlyComparison.previousMonth.revenue)}</p>
            </div>

            {/* Flèche de comparaison */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center">
                <ArrowRight className="w-6 h-6 text-gray-400 mb-2" />
                <p className="text-xs text-gray-600 mt-1">
                  {monthlyComparison.change >= 0 ? '+' : ''}
                  {formatCurrency(monthlyComparison.change)}
                </p>
              </div>
            </div>

            {/* Mois en cours */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Mois en cours</p>
              <p className="text-xs text-gray-500 mb-2">{monthlyComparison.currentMonth.name}</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(monthlyComparison.currentMonth.revenue)}</p>
            </div>
          </div>

          {/* Mini graphique de comparaison */}
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={[
                  { name: monthlyComparison.previousMonth.name.substring(0, 3), revenue: monthlyComparison.previousMonth.revenue },
                  { name: monthlyComparison.currentMonth.name.substring(0, 3), revenue: monthlyComparison.currentMonth.revenue },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Revenu']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="revenue" fill="#dc2626" radius={[8, 8, 0, 0]} activeBar={{ fill: '#ffe246' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
