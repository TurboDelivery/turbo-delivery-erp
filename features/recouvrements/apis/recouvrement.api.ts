import { PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import { IRecouvrement, IRecouvrementParams } from '@/feature-finance/revenus/types/recouvrement/recouvrement.types';
import { IRestaurantRecouvrement, IRestaurantRecouvrementSearchParams } from '@/features/recouvrements/types/restaurant-recouvrement.types';
import { IAccompte, IAccompteParams } from '@/features/recouvrements/types/accompte.types';

export interface IRecouvrementAPI {
  obtenirTousRecouvrements: (params: IRecouvrementParams) => Promise<PaginatedResponse<IRecouvrement>>;
  obtenirRecouvrement: (id: string) => Promise<IRecouvrement>;
  obtenirRestaurantRecouvrements: (params: IRestaurantRecouvrementSearchParams) => Promise<PaginatedResponse<IRestaurantRecouvrement>>;
  obtenirRecouvrementsRestaurant: (restaurantId: string) => Promise<IRecouvrement[]>;
  obtenirTousRestaurants: () => Promise<string[]>;
  ajouterRecouvrement: (data: FormData) => Promise<IRecouvrement>;
  modifierRecouvrement: (id: string, formData: FormData) => Promise<IRecouvrement>;
  supprimerRecouvrement: (id: string) => Promise<IRecouvrement>;
  // Méthodes pour les acomptes
  obtenirAccomptes: (params: IAccompteParams) => Promise<PaginatedResponse<IAccompte>>;
  obtenirAccompte: (id: string) => Promise<IAccompte>;
  ajouterAccompte: (data: FormData) => Promise<IAccompte>;
  modifierAccompte: (id: string, formData: FormData) => Promise<IAccompte>;
  supprimerAccompte: (id: string) => Promise<IAccompte>;
}

export const recouvrementAPI: IRecouvrementAPI = {
  obtenirTousRecouvrements(params: IRecouvrementParams): Promise<PaginatedResponse<IRecouvrement>> {
    return api.request<PaginatedResponse<IRecouvrement>>({
      endpoint: `finance/recouvrements/pagination`,
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  obtenirRestaurantRecouvrements(params: IRestaurantRecouvrementSearchParams): Promise<PaginatedResponse<IRestaurantRecouvrement>> {
    // Construire les paramètres de recherche
    const searchParams: any = {
      ...params,
      debut: params.debut ? params.debut.toISOString().split('T')[0] : undefined,
      fin: params.fin ? params.fin.toISOString().split('T')[0] : undefined,
    };

    // Ajouter le paramètre periode s'il existe
    if (params.periode) {
      searchParams.periode = params.periode;
    }

    return api.request<PaginatedResponse<IRestaurantRecouvrement>>({
      endpoint: `/erp/factures/pagination`,
      method: 'GET',
      searchParams: searchParams,
    });
  },

  obtenirRecouvrement(id: string): Promise<IRecouvrement> {
    return api.request<IRecouvrement>({
      endpoint: `finance/recouvrements/${id}`,
      method: 'GET',
    });
  },

  async obtenirRecouvrementsRestaurant(restaurantId: string): Promise<IRecouvrement[]> {
    return await api.request<IRecouvrement[]>({
      endpoint: `/finance/recouvrements/${restaurantId}/restaurant`,
      method: 'GET',
    });
  },

  async obtenirTousRestaurants(): Promise<string[]> {
    return await api.request<string[]>({
      endpoint: `/finance/recouvrements/restaurants`,
      method: 'GET',
    });
  },

  ajouterRecouvrement(formData: FormData): Promise<IRecouvrement> {
    return api.request<IRecouvrement>({
      endpoint: `finance/recouvrements`,
      method: 'POST',
      data: formData,
      config: {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    });
  },

  modifierRecouvrement(id: string, formData: FormData): Promise<IRecouvrement> {
    return api.request<IRecouvrement>({
      endpoint: `finance/recouvrements/${id}`,
      method: 'PUT',
      data: formData,
    });
  },

  supprimerRecouvrement(id: string): Promise<IRecouvrement> {
    return api.request<IRecouvrement>({
      endpoint: `finance/recouvrements/${id}`,
      method: 'DELETE',
    });
  },

  // Implémentation des méthodes pour les acomptes
  obtenirAccomptes(params: IAccompteParams): Promise<PaginatedResponse<IAccompte>> {
    // Construire les paramètres de recherche selon l'endpoint attendu
    const searchParams: any = {};
    
    if (params.restaurantId) {
      searchParams.restaurantId = params.restaurantId;
    }
    
    if (params.debut) {
      searchParams.debut = params.debut.toISOString().split('T')[0]; // Format YYYY-MM-DD
    }
    
    if (params.fin) {
      searchParams.fin = params.fin.toISOString().split('T')[0]; // Format YYYY-MM-DD
    }
    
    if (params.page !== undefined) {
      searchParams.page = params.page;
    }
    
    if (params.limit !== undefined) {
      searchParams.limit = params.limit;
    }
    
    if (params.orderBy) {
      searchParams.orderBy = params.orderBy;
    }
    
    if (params.orderDirection) {
      searchParams.orderDirection = params.orderDirection;
    }

    return api.request<PaginatedResponse<IAccompte>>({
      endpoint: `finance/accomptes`,
      method: 'GET',
      searchParams: searchParams as SearchParams,
    });
  },

  obtenirAccompte(id: string): Promise<IAccompte> {
    return api.request<IAccompte>({
      endpoint: `finance/accomptes/${id}`,
      method: 'GET',
    });
  },

  ajouterAccompte(formData: FormData): Promise<IAccompte> {
    return api.request<IAccompte>({
      endpoint: `finance/accomptes`,
      method: 'POST',
      data: formData,
      config: {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    });
  },

  modifierAccompte(id: string, formData: FormData): Promise<IAccompte> {
    return api.request<IAccompte>({
      endpoint: `finance/accomptes/${id}`,
      method: 'PUT',
      data: formData,
      config: {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    });
  },

  supprimerAccompte(id: string): Promise<IAccompte> {
    return api.request<IAccompte>({
      endpoint: `finance/accomptes/${id}`,
      method: 'DELETE',
    });
  },
};
