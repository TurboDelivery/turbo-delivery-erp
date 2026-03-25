import { IConge, ICongeAddUpdateResponse, ICongeDeleteResponse, ICongesParams } from "../types/conge.type";
import { PaginatedResponse } from "@/types/api.type";
import { SearchParams } from "ak-api-http";
import { CongeAddDTO, CongeUpdateDTO, CongeStatusUpdateDTO } from "../schemas/conge.schema";
import { IEmployee } from '@/features/personnel/types/types';
import { api } from "@/lib/api";

export interface ICongeAPI {
  obtenirTousConges(params: ICongesParams): Promise<PaginatedResponse<IConge>>;

  obtenirConge(id: string): Promise<IConge>;

  ajouterConge(data: CongeAddDTO): Promise<ICongeAddUpdateResponse>;

  modifierConge(id: string, data: CongeUpdateDTO): Promise<ICongeAddUpdateResponse>;

  supprimerConge(id: string): Promise<ICongeDeleteResponse>;

  approuverConge(id: string, data?: CongeStatusUpdateDTO): Promise<ICongeAddUpdateResponse>;

  rejeterConge(id: string, data?: CongeStatusUpdateDTO): Promise<ICongeAddUpdateResponse>;

  obtenirCongesParEmploye(employeeId: string): Promise<IConge[]>;
  obtenirEmployeEligible(params: ICongesParams): Promise<PaginatedResponse<IConge>>;
  obtenirEmployesEligiblesConge(): Promise<IEmployee[]>; // Nouvelle API pour les employés éligibles
  obtenirStatistiquesConges(): Promise<any>;
}

export const congeAPI: ICongeAPI = {
  obtenirTousConges(params: ICongesParams): Promise<PaginatedResponse<IConge>> {
    return api.request<PaginatedResponse<IConge>>({
      endpoint: `erp/conges`,
      method: "GET",
      searchParams: params as SearchParams,
      service:'private'
    });
  },

  obtenirConge(id: string): Promise<IConge> {
    return api.request<IConge>({
      endpoint: `erp/conges/${id}`,
      method: "GET",
      
    });
  },

  ajouterConge(data: CongeAddDTO): Promise<ICongeAddUpdateResponse> {
    return api.request<ICongeAddUpdateResponse>({
      endpoint: `/erp/conges`,
      method: "POST",
      data: data, // Ne pas forcer le statut, utiliser celui envoyé
      service: 'private'
    });
  },

  modifierConge(id: string, data: CongeUpdateDTO): Promise<ICongeAddUpdateResponse> {
    return api.request<ICongeAddUpdateResponse>({
      endpoint: `erp/conges/${id}`,
      method: "PUT", 
      data,
    });
  },

  supprimerConge(id: string): Promise<ICongeDeleteResponse> {
    return api.request<ICongeDeleteResponse>({
      endpoint: `erp/conges/${id}`,
      method: "DELETE",
    });
  },

  approuverConge(id: string, data?: CongeStatusUpdateDTO): Promise<ICongeAddUpdateResponse> {
    return api.request<ICongeAddUpdateResponse>({
      endpoint: `erp/conges/${id}/statut?statut=EN_COURS`,
      method: "PATCH",
      data: data || {},
    });
  },

  rejeterConge(id: string, data?: CongeStatusUpdateDTO): Promise<ICongeAddUpdateResponse> {
    return api.request<ICongeAddUpdateResponse>({
      endpoint: `erp/conges/${id}/statut?statut=REJETEE`,
      method: "PATCH",
      data: data || {},
    });
  },

  obtenirCongesParEmploye(employeeId: string): Promise<IConge[]> {
    return api.request<IConge[]>({
      endpoint: `/conges/employee/${employeeId}`,
      method: "GET",
    });
  },

  obtenirEmployeEligible(params: ICongesParams): Promise<PaginatedResponse<IConge>> {
    return api.request<PaginatedResponse<IConge>>({
      endpoint: `erp/employees/eligible-conge`,
      method: "GET",
      searchParams: params as SearchParams,
      service:'private'
    });
  },

  obtenirEmployesEligiblesConge(): Promise<IEmployee[]> {
    return api.request<IEmployee[]>({
      endpoint: `erp/employees/eligible-conge-list`,
      method: "GET",
      service:'private'
    });
  },

  obtenirStatistiquesConges(): Promise<any> {
    return api.request<any>({
      endpoint: `erp/conges/global/stats`,
      method: "GET",
      service:'private'
    });
  }
};
