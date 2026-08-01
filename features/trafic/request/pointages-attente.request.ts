import { apiClientHttp } from '@/lib/api-client-http';
import type { IPointageHorsZone } from '@/features/pointages-validation/pointages-validation.api';

/**
 * Pointages hors-zone en attente d'arbitrage.
 *
 * Le TRAFIC en a besoin parce que ces livreurs sont dans un angle mort : ils
 * ont pointé, mais tant que la décision n'est pas prise ils n'entrent pas en
 * file — donc ils ne reçoivent aucune course et n'apparaissent nulle part
 * comme un problème. Le bandeau d'action de l'écran comble ce trou.
 *
 * Échec réseau → liste vide : le bandeau disparaît, la carte reste utilisable.
 */
export async function getPointagesEnAttenteRequest(): Promise<IPointageHorsZone[]> {
  try {
    return await apiClientHttp.request<IPointageHorsZone[]>({
      endpoint: '/api/erp/pointages/a-valider',
      method: 'GET',
      params: { statut: 'EN_ATTENTE' },
    });
  } catch {
    return [];
  }
}
