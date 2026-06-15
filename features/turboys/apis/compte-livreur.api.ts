import { apiClientHttp } from '@/lib/api-client-http';
import { ITurboy } from '@/features/turboys/types/turboys.types';
import {
  ChangerStatutPieceDTO,
  CleActivationVm,
  EmissionCle,
  LivreurEvenementVm,
  ValiderCompteDTO,
  ValidationCompteVm,
} from '@/features/turboys/types/compte-livreur.types';

/**
 * Appels HTTP du module Comptes (M1) — back-office `/api/erp/livreur/*`.
 * Même contrôleur (et même service par défaut) que `updateTurboyType`.
 */
export const compteLivreurAPI = {
  async valider(id: string, dto: ValiderCompteDTO): Promise<ValidationCompteVm> {
    return await apiClientHttp.request<ValidationCompteVm>({
      endpoint: `/api/erp/livreur/${id}/valider`,
      method: 'POST',
      data: dto,
    });
  },

  async changerStatutPiece(id: string, dto: ChangerStatutPieceDTO): Promise<ITurboy> {
    return await apiClientHttp.request<ITurboy>({
      endpoint: `/api/erp/livreur/${id}/pieces`,
      method: 'PATCH',
      data: dto,
    });
  },

  async emettreCle(id: string, motif?: string): Promise<EmissionCle> {
    return await apiClientHttp.request<EmissionCle>({
      endpoint: `/api/erp/livreur/${id}/cle/emettre`,
      method: 'POST',
      data: { motif: motif ?? null },
    });
  },

  async listerCles(id: string): Promise<CleActivationVm[]> {
    return await apiClientHttp.request<CleActivationVm[]>({
      endpoint: `/api/erp/livreur/${id}/cles`,
      method: 'GET',
    });
  },

  async listerEvenements(id: string): Promise<LivreurEvenementVm[]> {
    return await apiClientHttp.request<LivreurEvenementVm[]>({
      endpoint: `/api/erp/livreur/${id}/evenements`,
      method: 'GET',
    });
  },
};
