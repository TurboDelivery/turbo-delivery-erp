import { apiClientHttp } from '@/lib/api-client-http';
import { IEmploiPointage } from '@/features/turboys/types/pointage.types';

/**
 * Pointages détaillés (M3). Réutilise l'endpoint existant qui renvoie toutes les
 * semaines d'emploi du temps du livreur avec leurs jours + signalements ; le
 * filtrage par plage de dates se fait côté ERP. Aucun nouvel endpoint backend.
 */
export const pointageAPI = {
  async listerParLivreur(livreurId: string): Promise<IEmploiPointage[]> {
    return await apiClientHttp.request<IEmploiPointage[]>({
      endpoint: `/api/erp/gestion-creneau/${livreurId}`,
      method: 'GET',
    });
  },
};
