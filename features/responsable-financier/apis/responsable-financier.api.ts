import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import {
  IAgentRecouvrement,
  IAjouterPreuveDTO,
  IDepotBanqueDTO,
  IDepotPartenaireDTO,
  IFactureRFDetail,
  IFactureRFListResponse,
  IFactureRFParams,
  IFactureRFRecouvrementVm,
  IFactureRFStatutVm,
  ILancerRecouvrementDTO,
  IRejeterDgaDTO,
  IValiderFactureDTO,
} from '../types/responsable-financier.types';

/**
 * 2026-05 (fix incident X-User-Id) — Helper pour générer la config axios qui
 * injecte le header X-User-Id quand le user authentifié est connu.
 *
 * <p>Plusieurs endpoints du workflow facture côté backend valident strictement
 * la présence de ce header (cf. ResponsableFinancierFactureService :
 * assignerRecouvrement throw BAD_REQUEST si userId null). Les autres sont
 * permissifs aujourd'hui mais on propage partout pour : (1) éviter d'avoir à
 * faire ce fix endpoint par endpoint à chaque fois que le backend devient
 * strict, (2) tracer dans les logs serveur quelle action a été déclenchée
 * par quel user — audit trail métier.</p>
 *
 * <p>Si userId est undefined (caller hors session, edge case test), on retombe
 * sur l'ancien comportement sans header → backend voit userId=null. Pour les
 * endpoints strict, ça repart en BAD_REQUEST côté serveur (échec rapide).</p>
 */
function withUserHeader(userId?: string) {
  return userId ? { headers: { 'X-User-Id': userId } } : undefined;
}

export interface IResponsableFinancierApi {
  obtenirFactures(params?: IFactureRFParams): Promise<IFactureRFListResponse>;
  obtenirFacture(id: string): Promise<IFactureRFDetail>;
  validerFacture(id: string, data: IValiderFactureDTO, userId?: string): Promise<IFactureRFStatutVm>;
  viserDg(id: string, userId?: string): Promise<IFactureRFStatutVm>;
  lancerRecouvrement(id: string, data: ILancerRecouvrementDTO, userId?: string): Promise<IFactureRFRecouvrementVm>;
  ajouterPreuve(id: string, data: IAjouterPreuveDTO, userId?: string): Promise<IFactureRFStatutVm>;
  marquerDepotPartenaire(id: string, data: IDepotPartenaireDTO, userId?: string): Promise<IFactureRFStatutVm>;
  marquerDepotBanque(id: string, data: IDepotBanqueDTO, userId?: string): Promise<IFactureRFStatutVm>;
  rejeterDga(id: string, data: IRejeterDgaDTO, userId?: string): Promise<IFactureRFStatutVm>;
  // 2026-05 (fix post-test mardi) — D3 du workflow facture : Comptable
  // confirme physiquement la réception des fonds versés par le caissier.
  // Émet un event d'historique + notif DGA + DG (sans changer le statut).
  confirmerReceptionComptable(id: string, userId?: string): Promise<IFactureRFStatutVm>;
  obtenirAgents(): Promise<IAgentRecouvrement[]>;
}

export const responsableFinancierAPI: IResponsableFinancierApi = {
  obtenirFactures(params?: IFactureRFParams): Promise<IFactureRFListResponse> {
    return api.request<IFactureRFListResponse>({
      endpoint: 'finance/responsable-financier/factures',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  obtenirFacture(id: string): Promise<IFactureRFDetail> {
    return api.request<IFactureRFDetail>({
      endpoint: `finance/responsable-financier/factures/${id}`,
      method: 'GET',
    });
  },

  validerFacture(id: string, data: IValiderFactureDTO, userId?: string): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/valider`,
      method: 'PATCH',
      data,
      config: withUserHeader(userId),
    });
  },

  viserDg(id: string, userId?: string): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/viser-dg`,
      method: 'PATCH',
      config: withUserHeader(userId),
    });
  },

  lancerRecouvrement(id: string, data: ILancerRecouvrementDTO, userId?: string): Promise<IFactureRFRecouvrementVm> {
    return api.request<IFactureRFRecouvrementVm>({
      endpoint: `finance/responsable-financier/factures/${id}/recouvrement`,
      method: 'PATCH',
      data,
      config: withUserHeader(userId),
    });
  },

  ajouterPreuve(id: string, data: IAjouterPreuveDTO, userId?: string): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/preuve`,
      method: 'PATCH',
      data,
      config: withUserHeader(userId),
    });
  },

  marquerDepotPartenaire(id: string, data: IDepotPartenaireDTO, userId?: string): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/depot-partenaire`,
      method: 'PATCH',
      data,
      config: withUserHeader(userId),
    });
  },

  marquerDepotBanque(id: string, data: IDepotBanqueDTO, userId?: string): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/depot-banque`,
      method: 'PATCH',
      data,
      config: withUserHeader(userId),
    });
  },

  rejeterDga(id: string, data: IRejeterDgaDTO, userId?: string): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/rejeter-dga`,
      method: 'PATCH',
      data,
      config: withUserHeader(userId),
    });
  },

  confirmerReceptionComptable(id: string, userId?: string): Promise<IFactureRFStatutVm> {
    // PATCH (pas de body) — l'identité de l'acteur est dans le header X-User-Id.
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/confirmer-reception-comptable`,
      method: 'PATCH',
      config: withUserHeader(userId),
    });
  },

  obtenirAgents(): Promise<IAgentRecouvrement[]> {
    return api.request<IAgentRecouvrement[]>({
      endpoint: 'finance/responsable-financier/agents',
      method: 'GET',
    });
  },
};
