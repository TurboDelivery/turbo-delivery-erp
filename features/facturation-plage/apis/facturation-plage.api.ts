import { apiClientHttp } from '@/lib/api-client-http';

import {
  IApercuPlage,
  IApercuSuppression,
  IConfigurationFacturationDto,
  IConfigurationPartenaire,
  IFactureGeneree,
  IGenerationPlageDto,
} from '../types/facturation-plage.types';

/**
 * Facturation par plage de dates (cahier DOSSOU du 10/08/2026).
 *
 * Backend : main-backend, `FacturationPlageResource` sur `/api/erp/facturation`.
 *
 * <p>Transport : `apiClientHttp`, et non le client `api` générique, parce que celui-ci
 * pose `X-User-Id` centralement depuis la session next-auth. Ce n'est pas un détail de
 * plomberie ici : RG-05 exige de savoir QUI a décidé de facturer telle période, et le
 * serveur enregistre l'auteur d'après cet en-tête. Sans lui, chaque facture générée
 * arriverait sans auteur.</p>
 */

const BASE = '/api/erp/facturation';

export const facturationPlageAPI = {
  /** Le récapitulatif chiffré et les conflits, sans rien écrire (RG-01, point 3.1.4). */
  apercu(restaurantId: string, debut: string, fin: string): Promise<IApercuPlage> {
    return apiClientHttp.request<IApercuPlage>({
      endpoint: `${BASE}/plage/apercu`,
      method: 'GET',
      params: { restaurantId, debut, fin },
    });
  },

  /** Génère la facture (et sa complémentaire si le partenaire facture séparément). */
  generer(dto: IGenerationPlageDto): Promise<IFactureGeneree[]> {
    return apiClientHttp.request<IFactureGeneree[]>({
      endpoint: `${BASE}/plage/generer`,
      method: 'POST',
      data: dto,
    });
  },

  /** Enregistre une facture émise hors ERP pendant la transition (§6, cas Agha). */
  reprendre(dto: IGenerationPlageDto): Promise<IFactureGeneree[]> {
    return apiClientHttp.request<IFactureGeneree[]>({
      endpoint: `${BASE}/plage/reprise`,
      method: 'POST',
      data: dto,
    });
  },

  listerConfiguration(): Promise<IConfigurationPartenaire[]> {
    return apiClientHttp.request<IConfigurationPartenaire[]>({
      endpoint: `${BASE}/configuration`,
      method: 'GET',
    });
  },

  enregistrerConfiguration(
    restaurantId: string,
    dto: IConfigurationFacturationDto,
  ): Promise<IConfigurationPartenaire> {
    return apiClientHttp.request<IConfigurationPartenaire>({
      endpoint: `${BASE}/configuration/${restaurantId}`,
      method: 'PUT',
      data: dto,
    });
  },

  /** Ce qu'une suppression va emporter, à afficher avant de confirmer (RG-06). */
  apercuSuppression(factureId: string): Promise<IApercuSuppression> {
    return apiClientHttp.request<IApercuSuppression>({
      endpoint: `/api/finance/factures/${factureId}/suppression-apercu`,
      method: 'GET',
    });
  },
};
