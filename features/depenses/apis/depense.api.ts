import { DepenseCreateDTO, DepenseUpdateDTO } from '@/features/depenses/schemas/depense.schema';
import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { IDepense, IDepensesParams, IDepenseStats, IDepenseStatsParams, IDepenseSummary, IDepenseSummaryParams } from '@/features/depenses/types/depense.type';
import { PaginatedResponse } from '@/types/general';

export interface IDepenseAPI {
  obtenirTousDepenses(params: IDepensesParams): Promise<PaginatedResponse<IDepense>>;
  obtenirDepense(id: string): Promise<IDepense>;
  ajouterDepense(data: DepenseCreateDTO): Promise<IDepense>;
  modifierDepense(id: string, data: DepenseUpdateDTO): Promise<IDepense>;
  supprimerDepense(id: string): Promise<IDepense>;
  obtenirStatsDepenses(params: IDepenseStatsParams): Promise<IDepenseStats>;
  obtenirDepensesSummary(params: IDepenseSummaryParams): Promise<IDepenseSummary>; // ✅ AJOUTÉ: Interface pour le summary
  exporterDepensesExcel(params: IDepensesParams): Promise<Blob>;
}

export const depenseAPI: IDepenseAPI = {
  async obtenirTousDepenses(params: IDepensesParams): Promise<PaginatedResponse<IDepense>> {
    return await api.request<PaginatedResponse<IDepense>>({
      endpoint: `/finance/depenses/pagination`,
      method: 'GET',
      searchParams: {
        ...params,
        debut: params.debut ? params.debut.toISOString().split('T')[0] : undefined,
        fin: params.fin ? params.fin.toISOString().split('T')[0] : undefined,
      } as SearchParams,
    });
  },

  async obtenirDepense(id: string): Promise<IDepense> {
    return await api.request<IDepense>({
      endpoint: `/finance/depenses/${id}`,
      method: 'GET',
    });
  },

  ajouterDepense(data: DepenseCreateDTO): Promise<IDepense> {
    console.log('🌐 API - Appel ajouterDepense avec:', data);
    console.log('📤 URL: /finance/depenses');
    console.log('📋 Méthode: POST');
    console.log('🔍 Données complètes:', JSON.stringify(data, null, 2));
    
    return api.request<IDepense>({
      endpoint: `/finance/depenses`,
      method: 'POST',
      data,
    }).then(response => {
      console.log('📥 Réponse API brute:', response);
      console.log('📊 Type de la réponse:', typeof response);
      console.log('🔑 Champs de la réponse:', Object.keys(response));
      console.log('💰 Montant retourné:', response.montant);
      console.log('📝 TypeDepense retourné:', response.typeDepense);
      console.log('📅 DateDepense retournée:', response.dateDepense);
      console.log('🆔 ID retourné:', response.id);
      return response;
    }).catch(error => {
      console.error('❌ Erreur API ajouterDepense:', error);
      throw error;
    });
  },

  modifierDepense(id: string, data: DepenseUpdateDTO): Promise<IDepense> {
    return api.request<IDepense>({
      endpoint: `/finance/depenses/${id}`,
      method: 'PUT',
      data,
    });
  },

  supprimerDepense(id: string): Promise<IDepense> {
    return api.request<IDepense>({
      endpoint: `/finance/depenses/${id}`,
      method: 'DELETE',
    });
  },

  obtenirStatsDepenses(params: IDepenseStatsParams): Promise<IDepenseStats> {
    console.log('🌐 API - Appel obtenirStatsDepenses avec:', params);
    
    const searchParams = new URLSearchParams();
    
    if (params.debut) {
      searchParams.append('debut', params.debut.toISOString().split('T')[0]);
    }
    
    if (params.fin) {
      searchParams.append('fin', params.fin.toISOString().split('T')[0]);
    }
    
    if (params.categoriesDepense && params.categoriesDepense.length > 0) {
      params.categoriesDepense.forEach((category) => {
        searchParams.append('categorieIds', category);
      });
    }
    
    const url = `/finance/depenses/stats${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    console.log('📤 URL Stats:', url);
    
    return api.request<IDepenseStats>({
      endpoint: url,
      method: 'GET',
    });
  },

  obtenirDepensesSummary(params: IDepenseSummaryParams): Promise<IDepenseSummary> {
    const searchParams = new URLSearchParams();
    
    if (params.debut) {
      searchParams.append('debut', params.debut.toISOString().split('T')[0]);
    }
    
    if (params.fin) {
      searchParams.append('fin', params.fin.toISOString().split('T')[0]);
    }
    
    if (params.categoriesDepense && params.categoriesDepense.length > 0) {
      params.categoriesDepense.forEach((category: string) => { // ✅ Type explicite
        searchParams.append('categorieIds', category);
      });
    }
    
    const url = `/finance/depenses/summary${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    console.log('📤 URL Summary:', url);
    
    return api.request<IDepenseSummary>({
      endpoint: url,
      method: 'GET',
    });
  },

  async exporterDepensesExcel(params: IDepensesParams): Promise<Blob> {
    return await api.request<Blob>({
      endpoint: `/finance/depenses/export`,
      method: 'GET',
      searchParams: {
        ...params,
        debut: params.debut ? params.debut.toISOString().split('T')[0] : undefined,
        fin: params.fin ? params.fin.toISOString().split('T')[0] : undefined,
      } as SearchParams,
    });
  },
};
