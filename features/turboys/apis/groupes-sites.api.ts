import type { IGroupeSites, IGroupeSitesPayload } from '@/features/turboys/types/programme.types';
import { apiClientHttp } from '@/lib/api-client-http';

/**
 * Secteurs et couvertures (SPEC §8.5, §8.6).
 *
 * <p>Deux préfixes, un seul modèle : ce sont deux regroupements de sites qui ne diffèrent
 * que par leur usage. Les écrire deux fois aurait dupliqué la même arithmétique.</p>
 */

const chemin = (genre: 'secteurs' | 'couvertures') => `/api/erp/${genre}`;

export const groupesSitesAPI = {
  async lister(genre: 'secteurs' | 'couvertures'): Promise<IGroupeSites[]> {
    return apiClientHttp.request<IGroupeSites[]>({ endpoint: chemin(genre), method: 'GET' });
  },

  async creer(genre: 'secteurs' | 'couvertures', payload: IGroupeSitesPayload): Promise<IGroupeSites> {
    return apiClientHttp.request<IGroupeSites>({ data: payload, endpoint: chemin(genre), method: 'POST' });
  },

  async modifier(genre: 'secteurs' | 'couvertures', id: string, payload: IGroupeSitesPayload): Promise<IGroupeSites> {
    return apiClientHttp.request<IGroupeSites>({
      data: payload,
      endpoint: `${chemin(genre)}/${id}`,
      method: 'PUT',
    });
  },

  /** Supprimer. Les sites du groupe passent « Sans secteur » / « Sans couverture ». */
  async supprimer(genre: 'secteurs' | 'couvertures', id: string): Promise<void> {
    await apiClientHttp.request<void>({ endpoint: `${chemin(genre)}/${id}`, method: 'DELETE' });
  },
};
