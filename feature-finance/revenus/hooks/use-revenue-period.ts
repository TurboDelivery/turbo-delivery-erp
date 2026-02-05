import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

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

interface UseRevenuePeriodProps {
  period: Period;
  date?: string;
  startDate?: string;
  endDate?: string;
  initialData?: RevenueResponse | null;
}

// Fonction pour appeler l'API
async function fetchRevenueByPeriod(period: Period, date?: string, startDate?: string, endDate?: string): Promise<RevenueResponse> {
  // Utiliser la route API locale Next.js comme proxy
  let url = "/api/revenue/analytics";
  
  if (startDate && endDate) {
    // Utiliser le vrai endpoint qui fonctionne correctement
    url = "/api/revenue/analytics/dates";
    url += `?debut=${startDate}&fin=${endDate}`;
  } else if (date) {
    url += `?period=${period}&date=${date}`;
  } else {
    url += `?period=${period}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des revenus pour la période ${period}: ${response.statusText}`);
  }
  
  return response.json();
}

export function useRevenuePeriod({ period, date, startDate, endDate, initialData = null }: UseRevenuePeriodProps) {
  const {
    data: revenueData = initialData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["revenue-period", period, date, startDate, endDate],
    queryFn: () => fetchRevenueByPeriod(period, date, startDate, endDate),
    enabled: !!period,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  return {
    revenueData,
    isLoading,
    isError,
    error,
    refetch
  };
}
