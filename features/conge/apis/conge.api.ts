import {
  IConge,
  ICongeAddUpdateResponse,
  ICongeDeleteResponse,
  ICongesParams
} from "../types/conge.type";
import {PaginatedResponse} from "@/types/api.type";
import {SearchParams} from "ak-api-http";
import {CongeAddDTO, CongeUpdateDTO, CongeStatusUpdateDTO} from "../schema/conge.schema";
import {apiClient} from "@/lib/api.client";

export interface ICongeAPI {
  obtenirTousConges(params: ICongesParams): Promise<PaginatedResponse<IConge>>;

  obtenirConge(id: string): Promise<IConge>;

  ajouterConge(data: CongeAddDTO): Promise<ICongeAddUpdateResponse>;

  modifierConge(id: string, data: CongeUpdateDTO): Promise<ICongeAddUpdateResponse>;

  supprimerConge(id: string): Promise<ICongeDeleteResponse>;

  approuverConge(id: string, data?: CongeStatusUpdateDTO): Promise<ICongeAddUpdateResponse>;

  rejeterConge(id: string, data?: CongeStatusUpdateDTO): Promise<ICongeAddUpdateResponse>;

  obtenirCongesParEmploye(employeeId: string): Promise<IConge[]>;
}

export const congeAPI: ICongeAPI = {
  obtenirTousConges(params: ICongesParams): Promise<PaginatedResponse<IConge>> {
    return apiClient.request<PaginatedResponse<IConge>>({
      endpoint: `/conges`,
      method: "GET",
      searchParams: params as SearchParams,
      service: "private",
    });
  },

  obtenirConge(id: string): Promise<IConge> {
    return apiClient.request<IConge>({
      endpoint: `/conges/${id}`,
      method: "GET",
      service: "private",
    });
  },

  ajouterConge(data: CongeAddDTO): Promise<ICongeAddUpdateResponse> {
    return apiClient.request<ICongeAddUpdateResponse>({
      endpoint: `/conges`,
      method: "POST",
      data,
      service: "private",
    });
  },

  modifierConge(id: string, data: CongeUpdateDTO): Promise<ICongeAddUpdateResponse> {
    return apiClient.request<ICongeAddUpdateResponse>({
      endpoint: `/conges/${id}`,
      method: "PATCH",
      data,
      service: "private",
    });
  },

  supprimerConge(id: string): Promise<ICongeDeleteResponse> {
    return apiClient.request<ICongeDeleteResponse>({
      endpoint: `/conges/${id}`,
      method: "DELETE",
      service: "private",
    });
  },

  approuverConge(id: string, data?: CongeStatusUpdateDTO): Promise<ICongeAddUpdateResponse> {
    return apiClient.request<ICongeAddUpdateResponse>({
      endpoint: `/conges/${id}/approve`,
      method: "POST",
      data: data || {},
      service: "private",
    });
  },

  rejeterConge(id: string, data?: CongeStatusUpdateDTO): Promise<ICongeAddUpdateResponse> {
    return apiClient.request<ICongeAddUpdateResponse>({
      endpoint: `/conges/${id}/reject`,
      method: "POST",
      data: data || {},
      service: "private",
    });
  },

  obtenirCongesParEmploye(employeeId: string): Promise<IConge[]> {
    return apiClient.request<IConge[]>({
      endpoint: `/conges/employee/${employeeId}`,
      method: "GET",
      service: "private",
    });
  },
};
