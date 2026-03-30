import { useQuery } from '@tanstack/react-query';
import { baseURL } from '@/config/api';

interface GlobalStatsResponse {
  chiffreAffaire: number;
  depenses: number;
  revenuEncaisse: number;
  solde: number;
  commission: number;
  fraisLivraison: number;
  investissement: number;
  commissionFixe: number;
  commissionPourcentage: number;
}

interface RapportFinancierResponse {
  chiffreAffaire: number;
  depensesFixes: number;
  depensesVariables: number;
  totalDepenses: number;
  benefice: number;
  tauxMarge: number;
  coutJournalierMoyen: number;
  caJournalierMoyen: number;
}

interface GlobalStatsParams {
  debut?: Date;
  fin?: Date;
}

const fetchGlobalStats = async (params: GlobalStatsParams): Promise<GlobalStatsResponse> => {
  const baseUrl = '/api/finance/global/stats';
  const searchParams = new URLSearchParams();
  
  if (params.debut) {
    searchParams.append('debut', params.debut.toISOString().split('T')[0]);
  }
  if (params.fin) {
    searchParams.append('fin', params.fin.toISOString().split('T')[0]);
  }
  
  const url = `${baseUrl}?${searchParams.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  return response.json();
};

const fetchRapportStats = async (params: GlobalStatsParams): Promise<RapportFinancierResponse> => {
  const baseUrl = `${baseURL}/api/finance/depenses/kpis/range`;
  const searchParams = new URLSearchParams();
  
  if (params.debut) {
    searchParams.append('debut', params.debut.toISOString().split('T')[0]);
  }
  if (params.fin) {
    searchParams.append('fin', params.fin.toISOString().split('T')[0]);
  }
  
  const url = `${baseUrl}?${searchParams.toString()}`;
  console.log('URL appelée:', url);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  return response.json();
};

export const useRapportFinancier = (params: GlobalStatsParams) => {
  return useQuery({
    queryKey: ['rapportFinancier', params],
    queryFn: () => fetchRapportStats(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useGlobalStats = (params: GlobalStatsParams) => {
  return useQuery({
    queryKey: ['globalStats', params],
    queryFn: () => fetchGlobalStats(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
