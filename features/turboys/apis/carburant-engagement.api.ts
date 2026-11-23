import { api } from '@/lib/api';
import type { IEtatCarburantSemaine, ISoumissionSurplus } from '@/features/turboys/types/programme.types';

/**
 * Engager le carburant d'une semaine : un envoi MULTIPART depuis le navigateur.
 *
 * <p>Le circuit finance exige un justificatif à la création d'une charge ; ici c'est le
 * PDF des programmes publiés, généré à l'écran. Un fichier ne passe pas par une action
 * serveur : on appelle le backend directement, avec le même client et le même en-tête
 * `X-User-Id` que la création d'une dépense dans le module finance.</p>
 */
export function engagerCarburant(donnees: FormData, userId?: string): Promise<IEtatCarburantSemaine> {
  const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
  if (userId) headers['X-User-Id'] = userId;
  return api.request<IEtatCarburantSemaine>({
    endpoint: '/erp/programmes/carburant/engager',
    method: 'POST',
    data: donnees,
    config: { headers },
  });
}

/**
 * Soumettre au décaissement les surplus d'une semaine écoulée (décision du 23/11).
 *
 * <p>Même forme que l'engagement, et pour la même raison : le circuit finance exige un
 * justificatif à la création d'une charge. C'est ici le détail des surplus de la
 * semaine — qui, quel jour, quel site, quel motif.</p>
 *
 * <p>La charge créée est DISTINCTE de celle de la dotation : celle que le DGA a visée ne
 * bouge plus.</p>
 */
export function soumettreSurplus(donnees: FormData, userId?: string): Promise<ISoumissionSurplus> {
  const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
  if (userId) headers['X-User-Id'] = userId;
  return api.request<ISoumissionSurplus>({
    endpoint: '/erp/programmes/surplus/soumettre',
    method: 'POST',
    data: donnees,
    config: { headers },
  });
}
