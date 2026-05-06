import { useQuery } from '@tanstack/react-query';

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

interface RapportFinancierParams {
    debut?: Date;
    fin?: Date;
}

const fetchRapportFinancierStats = async (params: RapportFinancierParams): Promise<RapportFinancierResponse> => {
    const baseUrl = '/api/finance/depenses/kpis/range';
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

export const useRapportFinancierStats = (params: RapportFinancierParams) => {
    return useQuery({
        queryKey: ['rapportFinancierStats', params],
        queryFn: () => fetchRapportFinancierStats(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
};
