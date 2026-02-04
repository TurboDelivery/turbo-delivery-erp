"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
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
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("WEEK");
  
  const { revenueData, isLoading, isError, error } = useRevenuePeriod({ 
    period: selectedPeriod,
    initialData: null
  });

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('fr-FR')} ${revenueData?.currency || 'XOF'}`;
  };

  const getPeriodDisplay = () => {
    if (!revenueData) return "";
    
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de période */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Revenus par période</h2>
        <div className="flex gap-2">
          {(Object.keys(periodLabels) as Period[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedPeriod === period
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {periodLabels[period]}
            </button>
          ))}
        </div>
      </div>

      {/* Carte de résumé du revenu */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Revenu {periodLabels[selectedPeriod]}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{getPeriodDisplay()}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(revenueData?.statistics.total || 0)}
              </p>
              {revenueData?.comparison && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                  revenueData.comparison.trend === "up" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  {revenueData.comparison.trend === "up" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(revenueData.comparison.changePercentage)}%
                </div>
              )}
            </div>
          </div>
          <div className="p-3 bg-blue-200 rounded-full">
            <DollarSign className="w-6 h-6 text-blue-700" />
          </div>
        </div>
        
        {/* Statistiques additionnelles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-blue-200">
          <div>
            <p className="text-xs text-gray-600">Moyenne</p>
            <p className="text-sm font-semibold text-gray-800">
              {formatCurrency(revenueData?.statistics.average || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Maximum</p>
            <p className="text-sm font-semibold text-gray-800">
              {formatCurrency(revenueData?.statistics.max || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Livraisons</p>
            <p className="text-sm font-semibold text-gray-800">
              {revenueData?.statistics.deliveriesCount || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Moyenne/Livraison</p>
            <p className="text-sm font-semibold text-gray-800">
              {formatCurrency(revenueData?.statistics.averagePerDelivery || 0)}
            </p>
          </div>
        </div>
      </Card>

      {/* Graphique */}
      <Card className="p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Évolution des revenus - {periodLabels[selectedPeriod]}
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
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Détails additionnels */}
      {revenueData?.breakdown && (
        <Card className="p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition des revenus</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 font-medium">Frais de livraison</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(revenueData.breakdown.deliveryFees)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">Pourboires</p>
              <p className="text-xl font-bold text-purple-700">
                {formatCurrency(revenueData.breakdown.tips)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Revenu total</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(revenueData.breakdown.totalRevenue)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
