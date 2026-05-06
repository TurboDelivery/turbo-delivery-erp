'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface InvestissementStatsData {
  totalInvestissement: number;
  totalRembourse: number;
  totalARembourserCeMois: number;
  montantRestant: number;
  monthlyData: Array<{
    date: string;
    montantInvestissement: number;
    montantRembourse: number;
  }>;
}

interface UseInvestissementStatsParams {
  startDate?: string;
  endDate?: string;
}

export function useInvestissementStats(params: UseInvestissementStatsParams = {}) {
  const { startDate, endDate } = params;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['investissement-stats', startDate, endDate],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const url = `/api/finance/investissements/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('=== DEBUGGING INVESTISSEMENT STATS ===');
      console.log('URL:', url);
      console.log('Params:', { startDate, endDate });

      try {
        const response = await fetch(url);

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response:', errorText);
          throw new Error(`Failed to fetch investissement stats: ${response.status} - ${errorText}`);
        }

        const jsonData = await response.json();
        console.log('Response data:', jsonData);
        console.log('=== FIN DEBUGGING ===');

        return jsonData as Promise<InvestissementStatsData>;
      } catch (err) {
        console.log('Fetch error:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    investissementStats: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
