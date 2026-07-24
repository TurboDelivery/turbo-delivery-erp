import { apiClientHttp } from '@/lib/api-client-http';

/** Ligne de la grille tarifaire d'un restaurant (zone de livraison + prix). */
export interface IFraisLivraison {
  id: string;
  zone: string;
  prix: number;
  distanceDebut: number;
  distanceFin: number;
  latitude: number;
  longitude: number;
  restaurantId?: string;
}

/** Grille tarifaire complète d'un restaurant (toutes ses zones de livraison). */
export async function getGrilleTarifaireApi(restaurantId: string): Promise<IFraisLivraison[]> {
  return apiClientHttp.request<IFraisLivraison[]>({
    endpoint: `/api/restaurant/frais-livraison/${restaurantId}/restaurant`,
    method: 'GET',
  });
}
