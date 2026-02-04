"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, DollarSign, BarChart3, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useRevenuePeriod } from "../hooks/use-revenue-period";

type Period = "DAY" | "WEEK" | "MONTH" | "YEAR";

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
    trend: "up" | "down";
  } | null;
}

const periodLabels = {
  DAY: "Jour",
  WEEK: "Semaine", 
  MONTH: "Mois",
  YEAR: "Année"
};

export default function RevenuePeriodChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("MONTH");
  const [customDate, setCustomDate] = useState<string>("");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [useCustomRange, setUseCustomRange] = useState<boolean>(false);
  
  // Fonction pour déterminer si on doit envoyer la date à l'API
  const apiDate = useMemo(() => {
    if (useCustomRange && customStartDate) {
      return customStartDate; // Pour les périodes personnalisées, on envoie la date de début
    }
    
    if (!customDate) return undefined;
    
    // Pour DAY, on envoie la date exacte
    if (selectedPeriod === "DAY") {
      return customDate;
    }
    
    // Pour WEEK, MONTH, YEAR, on envoie le premier jour de la période
    const date = new Date(customDate);
    switch (selectedPeriod) {
      case "WEEK":
        // Trouver le début de la semaine (lundi)
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        return monday.toISOString().split('T')[0];
      case "MONTH":
        // Premier jour du mois
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      case "YEAR":
        // Premier jour de l'année
        return new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0];
      default:
        return customDate;
    }
  }, [customDate, selectedPeriod, useCustomRange, customStartDate]);
  
  // Fonction pour déterminer la période appropriée selon la plage de dates
  const getPeriodForRange = useMemo(() => {
    if (!useCustomRange || !customStartDate || !customEndDate) {
      return selectedPeriod;
    }
    
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Logique optimisée : toujours utiliser MONTH pour les plages personnalisées car DAY retourne des données horaires vides
    // Même pour un seul jour, MONTH donnera les données journalières correctes
    if (daysDiff <= 31) {
      return "MONTH"; // Pour toutes les plages personnalisées, utiliser MONTH pour obtenir les données journalières
    } else if (daysDiff <= 90) {
      return "MONTH";
    } else {
      return "YEAR";
    }
  }, [useCustomRange, customStartDate, customEndDate, selectedPeriod]);
  
  // Utiliser la période ajustée pour l'API
  const apiPeriodForCall = useCustomRange ? getPeriodForRange : selectedPeriod;
  
  const { revenueData, isLoading, isError, error } = useRevenuePeriod({ 
    period: apiPeriodForCall,
    date: useCustomRange ? undefined : apiDate,
    startDate: useCustomRange && customStartDate ? customStartDate : undefined,
    endDate: useCustomRange && customEndDate ? customEndDate : undefined,
    initialData: null
  });

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('fr-FR')} ${revenueData?.currency || 'XOF'}`;
  };

  // Calculer les statistiques localement si celles de l'API sont vides
  const calculatedStats = useMemo(() => {
    if (!revenueData || !revenueData.data || revenueData.data.length === 0) {
      return null;
    }

    // Pour les plages personnalisées, toujours calculer localement pour filtrer correctement
    if (useCustomRange && customStartDate && customEndDate) {
      // Filtrer les données selon la période
      let filteredData = revenueData.data;
      
      if (apiPeriodForCall === "MONTH") {
        // Définir les jours avant le filtrage pour le debugging
        const startDay = new Date(customStartDate).getDate();
        const endDay = new Date(customEndDate).getDate();
        
        // Filtrer les données journalières pour ne garder que les jours dans la plage
        filteredData = revenueData.data.filter(item => {
          const dayNum = parseInt(item.label);
          return dayNum >= startDay && dayNum <= endDay;
        });
        
      } else if (apiPeriodForCall === "DAY") {
        // Pour DAY, si c'est une plage d'un jour, garder toutes les données horaires
        // Sinon, si c'est un seul jour, garder toutes les données horaires
        filteredData = revenueData.data;
      }

      // Calculer à partir des données filtrées
      const values = filteredData.map(item => Number(item.value) || 0);
      const total = values.reduce((sum, val) => sum + val, 0);
      const average = values.length > 0 ? total / values.length : 0;
      const max = Math.max(...values, 0);
      const min = Math.min(...values, 0);

      return {
        total,
        average,
        max,
        min,
        deliveriesCount: revenueData.statistics.deliveriesCount || 0, // Garder la valeur de l'API si disponible
        averagePerDelivery: revenueData.statistics.averagePerDelivery || 0
      };
    }

    // Si les statistiques de l'API sont valides, les utiliser
    if (revenueData.statistics.total > 0) {
      return revenueData.statistics;
    }

    // Sinon, calculer à partir des données
    const values = revenueData.data.map(item => Number(item.value) || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = values.length > 0 ? total / values.length : 0;
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);

    return {
      total,
      average,
      max,
      min,
      deliveriesCount: revenueData.statistics.deliveriesCount || 0,
      averagePerDelivery: revenueData.statistics.averagePerDelivery || 0
    };
  }, [revenueData, useCustomRange, customStartDate, customEndDate, apiPeriodForCall]);

  // Utiliser les statistiques calculées ou celles de l'API
  const stats = useMemo(() => {
    // Pour les plages personnalisées, toujours utiliser les stats calculées
    if (useCustomRange && calculatedStats) {
      return calculatedStats;
    }
    // Sinon, utiliser les stats de l'API
    return revenueData?.statistics;
  }, [useCustomRange, calculatedStats, revenueData?.statistics]);

  // Récupérer les données YEAR pour la comparaison mensuelle
  const { revenueData: yearData } = useRevenuePeriod({ 
    period: "YEAR",
    date: undefined,
    startDate: undefined,
    endDate: undefined,
    initialData: null
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
    const currentMonthData = yearData.data.find(item => {
      return item.month === currentMonth;
    });

    const previousMonthData = yearData.data.find(item => {
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
        revenue: currentRevenue
      },
      previousMonth: {
        name: new Date(previousYear, previousMonth - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        revenue: previousRevenue
      },
      change,
      changePercentage: Math.abs(changePercentage)
    };
  }, [yearData]);

  const getPeriodDisplay = () => {
    if (!revenueData) return "";
    
    // Si une période personnalisée est sélectionnée, l'afficher en priorité
    if (useCustomRange && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      return `Période du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
    }
    
    // Si une date personnalisée est sélectionnée, l'afficher en priorité
    if (customDate) {
      const date = new Date(customDate);
      switch (selectedPeriod) {
        case "DAY":
          return `Jour du ${date.toLocaleDateString('fr-FR')}`;
        case "WEEK":
          // Pour une semaine, on affiche la semaine de la date sélectionnée
          return `Semaine du ${date.toLocaleDateString('fr-FR')}`;
        case "MONTH":
          return `Mois de ${date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
        case "YEAR":
          return `Année ${date.getFullYear()}`;
        default:
          return "";
      }
    }
    
    // Sinon, utiliser les données de l'API
    switch (revenueData.period) {
      case "day":
        return revenueData.date ? `Jour du ${new Date(revenueData.date).toLocaleDateString('fr-FR')}` : "Aujourd'hui";
      case "week":
        if (revenueData.startDate && revenueData.endDate) {
          const start = new Date(revenueData.startDate);
          const end = new Date(revenueData.endDate);
          return `Semaine du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
        }
        return "Cette semaine";
      case "month":
        return `Mois de ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
      case "year":
        return `Année ${new Date().getFullYear()}`;
      default:
        return "";
    }
  };

  const getDateInputType = () => {
    switch (selectedPeriod) {
      case "DAY":
        return "date";
      case "WEEK":
        return "week"; 
      case "MONTH":
        return "month";
      case "YEAR":
        return "year";
      default:
        return "date";
    }
  };

  const getDatePlaceholder = () => {
    switch (selectedPeriod) {
      case "DAY":
        return "Sélectionner un jour";
      case "WEEK":
        return "Sélectionner une semaine";
      case "MONTH":
        return "Sélectionner un mois";
      case "YEAR":
        return "Sélectionner une année";
      default:
        return "Sélectionner une date";
    }
  };

  const getMinDate = () => {
    // Date minimum : 1 an en arrière
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    // Date maximum : aujourd'hui
    return new Date().toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDate(e.target.value);
  };

  const clearCustomDate = () => {
    setCustomDate("");
  };

  const clearCustomRange = () => {
    setCustomStartDate("");
    setCustomEndDate("");
    setUseCustomRange(false);
  };

  const handleRangeToggle = () => {
    setUseCustomRange(!useCustomRange);
    if (!useCustomRange) {
      // Quand on active la plage personnalisée, réinitialiser la date simple
      setCustomDate("");
    } else {
      // Quand on désactive la plage personnalisée, réinitialiser les dates de plage
      clearCustomRange();
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStartDate(e.target.value);
    // S'assurer que la date de fin est après la date de début
    if (customEndDate && e.target.value > customEndDate) {
      setCustomEndDate("");
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomEndDate(e.target.value);
  };

  const isDateRangeValid = () => {
    return customStartDate && customEndDate && customStartDate <= customEndDate;
  };

  // Filtrer les données du graphique selon la plage personnalisée
  const getFilteredChartData = useMemo(() => {
    if (!revenueData?.data) return [];
    
    // Pour les plages personnalisées avec MONTH, filtrer les jours
    if (useCustomRange && customStartDate && customEndDate && apiPeriodForCall === "MONTH") {
      return revenueData.data.filter(item => {
        const dayNum = parseInt(item.label);
        const startDay = new Date(customStartDate).getDate();
        const endDay = new Date(customEndDate).getDate();
        return dayNum >= startDay && dayNum <= endDay;
      });
    }
    
    // Sinon, retourner toutes les données
    return revenueData.data;
  }, [revenueData, useCustomRange, customStartDate, customEndDate, apiPeriodForCall]);

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
          <p className="text-yellow-600">Aucune donnée disponible</p>
        </div>
        
        {/* Section de debugging pour les plages personnalisées */}
        {useCustomRange && (
          <Card className="p-4 bg-gray-50 border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Informations de debugging</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Période sélectionnée:</strong> {selectedPeriod}</p>
              <p><strong>Période API:</strong> {apiPeriodForCall}</p>
              <p><strong>Date début:</strong> {customStartDate}</p>
              <p><strong>Date fin:</strong> {customEndDate}</p>
              <p><strong>Jours:</strong> {Math.ceil((new Date(customEndDate!).getTime() - new Date(customStartDate!).getTime()) / (1000 * 60 * 60 * 24))}</p>
              <p><strong>Auto-ajusté:</strong> {apiPeriodForCall !== selectedPeriod ? 'Oui' : 'Non'}</p>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    
    <div className="space-y-6">
      {/* En-tête avec sélecteur de période et dates */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Revenus par période</h2>
        
        <div className="flex flex-col gap-4">
          {/* Sélecteur de périodes */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(periodLabels).map(([period, label]) => (
              <button
                key={period}
                onClick={() => {
                  setSelectedPeriod(period as Period);
                  setCustomDate("");
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setUseCustomRange(false);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPeriod === period && !useCustomRange
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Options de date personnalisée */}
          <div className="flex flex-col gap-3">
            {/* Toggle pour plage personnalisée */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRangeToggle}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  useCustomRange
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {useCustomRange ? "Plage personnalisée" : "Date simple"}
              </button>
            </div>
            
            {useCustomRange ? (
              /* Sélecteurs de plage de dates */
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={handleStartDateChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    placeholder="Date de début"
                    className="px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <span className="text-gray-500">au</span>
                <div className="relative">
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={handleEndDateChange}
                    min={customStartDate || getMinDate()}
                    max={getMaxDate()}
                    placeholder="Date de fin"
                    className="px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                {customStartDate && (
                  <button
                    onClick={clearCustomRange}
                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              /* Sélecteur de date simple */
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={customDate}
                    onChange={handleDateChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    placeholder={getDatePlaceholder()}
                    className="px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {customDate && (
                    <button
                      onClick={clearCustomDate}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {customDate ? "Date personnalisée" : "Période actuelle"}
                </span>
              </div>
            )}
            
            {/* Validation de la plage de dates */}
            {useCustomRange && customStartDate && customEndDate && !isDateRangeValid() && (
              <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                La date de fin doit être après la date de début
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section d'information pour les dates personnalisées */}
      {(customDate || (useCustomRange && customStartDate && customEndDate)) && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-800 mb-1">
                {useCustomRange ? "Période personnalisée" : "Date personnalisée"}
              </h4>
              <p className="text-xs text-blue-600">
                Vous consultez les revenus pour {getPeriodDisplay().toLowerCase()}. 
                Pour revenir à la période actuelle, cliquez sur le bouton "×" à côté du sélecteur de date.
              </p>
              {useCustomRange && apiPeriodForCall !== selectedPeriod && (
                <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                  <p className="text-xs text-orange-700">
                    <strong>Auto-ajustement :</strong> La période "{periodLabels[selectedPeriod]}" a été automatiquement ajustée à "{periodLabels[apiPeriodForCall]}" pour mieux correspondre à la durée de votre plage ({Math.ceil((new Date(customEndDate!).getTime() - new Date(customStartDate!).getTime()) / (1000 * 60 * 60 * 24))} jours).
                  </p>
                  {apiPeriodForCall === "MONTH" && (
                    <p className="text-xs text-orange-600 mt-1">
                      💡 Les plages personnalisées utilisent "Mois" pour obtenir les données journalières (plus fiable que les données horaires).
                    </p>
                  )}
                </div>
              )}
              
                          </div>
          </div>
        </Card>
      )}

      {/* Carte de résumé du revenu */}
      <Card className="p-6 bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Revenu {useCustomRange ? periodLabels[apiPeriodForCall] : periodLabels[selectedPeriod]}
              </h3>
              {(customDate || (useCustomRange && customStartDate && customEndDate)) && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  useCustomRange 
                    ? "bg-purple-100 text-purple-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  {useCustomRange ? "Plage" : "Personnalisé"}
                </span>
              )}
              {useCustomRange && apiPeriodForCall !== selectedPeriod && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  Auto-ajusté
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{getPeriodDisplay()}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(stats?.total || 0)}
              </p>
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
            <p className="text-sm font-semibold text-gray-800">
              {formatCurrency(stats?.average || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Maximum</p>
            <p className="text-sm font-semibold text-gray-800">
              {formatCurrency(stats?.max || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Livraisons</p>
            <p className="text-sm font-semibold text-gray-800">
              {stats?.deliveriesCount || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Moyenne/Livraison</p>
            <p className="text-sm font-semibold text-gray-800">
              {formatCurrency(stats?.averagePerDelivery || 0)}
            </p>
          </div>
        </div>
      </Card>

      {/* Graphique */}
      <Card className="p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Évolution des revenus - {useCustomRange ? periodLabels[apiPeriodForCall] : periodLabels[selectedPeriod]}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={revenueData?.data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="label" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), "Revenu"]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#dc2626" 
              strokeWidth={3}
              dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#ffe246" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Carte de comparaison mensuelle */}
      {monthlyComparison && (
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
              <p className="text-2xl font-bold text-gray-700">
                {formatCurrency(monthlyComparison.previousMonth.revenue)}
              </p>
            </div>
            
            {/* Flèche de comparaison */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center">
                <ArrowRight className="w-6 h-6 text-gray-400 mb-2" />
                <p className="text-xs text-gray-600 mt-1">
                  {monthlyComparison.change >= 0 ? "+" : ""}{formatCurrency(monthlyComparison.change)}
                </p>
              </div>
            </div>
            
            {/* Mois en cours */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Mois en cours</p>
              <p className="text-xs text-gray-500 mb-2">{monthlyComparison.currentMonth.name}</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(monthlyComparison.currentMonth.revenue)}
              </p>
            </div>
          </div>
          
          {/* Mini graphique de comparaison */}
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={[
                { name: monthlyComparison.previousMonth.name.substring(0, 3), revenue: monthlyComparison.previousMonth.revenue },
                { name: monthlyComparison.currentMonth.name.substring(0, 3), revenue: monthlyComparison.currentMonth.revenue }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "Revenu"]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#dc2626"
                  radius={[8, 8, 0, 0]}
                  activeBar={{ fill: "#ffe246" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
