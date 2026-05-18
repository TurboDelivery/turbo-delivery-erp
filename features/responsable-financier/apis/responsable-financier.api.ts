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
  IValiderFactureDTO,
} from '../types/responsable-financier.types';

export interface IResponsableFinancierApi {
  obtenirFactures(params?: IFactureRFParams): Promise<IFactureRFListResponse>;
  obtenirFacture(id: string): Promise<IFactureRFDetail>;
  validerFacture(id: string, data: IValiderFactureDTO): Promise<IFactureRFStatutVm>;
  viserDg(id: string): Promise<IFactureRFStatutVm>;
  lancerRecouvrement(id: string, data: ILancerRecouvrementDTO): Promise<IFactureRFRecouvrementVm>;
  ajouterPreuve(id: string, data: IAjouterPreuveDTO): Promise<IFactureRFStatutVm>;
  marquerDepotPartenaire(id: string, data: IDepotPartenaireDTO): Promise<IFactureRFStatutVm>;
  marquerDepotBanque(id: string, data: IDepotBanqueDTO): Promise<IFactureRFStatutVm>;
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

  validerFacture(id: string, data: IValiderFactureDTO): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/valider`,
      method: 'PATCH',
      data,
    });
  },

  viserDg(id: string): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/viser-dg`,
      method: 'PATCH',
    });
  },

  lancerRecouvrement(id: string, data: ILancerRecouvrementDTO): Promise<IFactureRFRecouvrementVm> {
    return api.request<IFactureRFRecouvrementVm>({
      endpoint: `finance/responsable-financier/factures/${id}/recouvrement`,
      method: 'PATCH',
      data,
    });
  },

  ajouterPreuve(id: string, data: IAjouterPreuveDTO): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/preuve`,
      method: 'PATCH',
      data,
    });
  },

  marquerDepotPartenaire(id: string, data: IDepotPartenaireDTO): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/depot-partenaire`,
      method: 'PATCH',
      data,
    });
  },

  marquerDepotBanque(id: string, data: IDepotBanqueDTO): Promise<IFactureRFStatutVm> {
    return api.request<IFactureRFStatutVm>({
      endpoint: `finance/responsable-financier/factures/${id}/depot-banque`,
      method: 'PATCH',
      data,
    });
  },

  obtenirAgents(): Promise<IAgentRecouvrement[]> {
    return api.request<IAgentRecouvrement[]>({
      endpoint: 'finance/responsable-financier/agents',
      method: 'GET',
    });
  },
};
