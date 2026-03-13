// import { LeaveRequest, LeaveRequestType, LeaveRequestCreateDTO, LeaveRequestUpdateDTO } from '@/features/personnel/schemas/leave-request.schema';
// import { SearchParams } from 'ak-api-http';
// import { api } from '@/lib/api';
// import { PaginatedResponse } from '@/types/general';

// export interface ILeaveRequestAPI {
//   obtenirToutesDemandes(params: ILeaveRequestParams): Promise<PaginatedResponse<LeaveRequest>>;
//   obtenirDemande(id: string): Promise<LeaveRequest>;
//   ajouterDemande(data: LeaveRequestCreateDTO): Promise<LeaveRequest>;
//   modifierDemande(id: string, data: LeaveRequestUpdateDTO): Promise<LeaveRequest>;
//   supprimerDemande(id: string): Promise<LeaveRequest>;
//   approuverDemande(id: string): Promise<LeaveRequest>;
//   rejeterDemande(id: string): Promise<LeaveRequest>;
//   obtenirStatsDemandes(params: ILeaveRequestStatsParams): Promise<ILeaveRequestStats>;
//   exporterDemandesExcel(params: ILeaveRequestParams): Promise<Blob>;
// }

// export interface ILeaveRequestParams {
//   page?: number;
//   limit?: number;
//   employeeId?: string;
//   type?: string;
//   statut?: string;
//   dateDebut?: string;
//   dateFin?: string;
//   orderBy?: string;
//   orderDirection?: 'asc' | 'desc';
// }

// export interface ILeaveRequestStats {
//   nombre_total: number;
//   nombre_en_attente: number;
//   nombre_approuvees: number;
//   nombre_rejetees: number;
//   nombre_en_cours: number;
//   nombre_terminees: number;
//   jours_pris_ce_mois: number;
//   jours_en_cours: number;
// }

// export interface ILeaveRequestStatsParams {
//   debut?: Date;
//   fin?: Date;
//   employeeIds?: string[];
//   types?: string[];
//   statuts?: string[];
// }

// export const leaveRequestAPI: ILeaveRequestAPI = {
//   async obtenirToutesDemandes(params: ILeaveRequestParams): Promise<PaginatedResponse<LeaveRequest>> {
//     return await api.request<PaginatedResponse<LeaveRequest>>({
//       endpoint: `/personnel/conges/pagination`,
//       method: 'GET',
//       searchParams: {
//         ...params,
//       } as SearchParams,
//     });
//   },

//   async obtenirDemande(id: string): Promise<LeaveRequest> {
//     return await api.request<LeaveRequest>({
//       endpoint: `/personnel/conges/${id}`,
//       method: 'GET',
//     });
//   },

//   async ajouterDemande(data: LeaveRequestCreateDTO): Promise<LeaveRequest> {
//     console.log('🌐 API - Appel ajouterDemande avec:', data);
    
//     return api.request<LeaveRequest>({
//       endpoint: `/personnel/conges`,
//       method: 'POST',
//       data,
//     }).then(response => {
//       console.log('📥 Réponse API ajouterDemande:', response);
//       return response;
//     }).catch(error => {
//       console.error('❌ Erreur API ajouterDemande:', error);
//       throw error;
//     });
//   },

//   async modifierDemande(id: string, data: LeaveRequestUpdateDTO): Promise<LeaveRequest> {
//     return api.request<LeaveRequest>({
//       endpoint: `/personnel/conges/${id}`,
//       method: 'PUT',
//       data,
//     });
//   },

//   async supprimerDemande(id: string): Promise<LeaveRequest> {
//     return api.request<LeaveRequest>({
//       endpoint: `/personnel/conges/${id}`,
//       method: 'DELETE',
//     });
//   },

//   async approuverDemande(id: string): Promise<LeaveRequest> {
//     return api.request<LeaveRequest>({
//       endpoint: `/personnel/conges/${id}/approuver`,
//       method: 'POST',
//     });
//   },

//   async rejeterDemande(id: string): Promise<LeaveRequest> {
//     return api.request<LeaveRequest>({
//       endpoint: `/personnel/conges/${id}/rejeter`,
//       method: 'POST',
//     });
//   },

//   async obtenirStatsDemandes(params: ILeaveRequestStatsParams): Promise<ILeaveRequestStats> {
//     console.log('🌐 API - Appel obtenirStatsDemandes avec:', params);
    
//     const searchParams = new URLSearchParams();
    
//     if (params.debut) {
//       searchParams.append('debut', params.debut.toISOString().split('T')[0]);
//     }
    
//     if (params.fin) {
//       searchParams.append('fin', params.fin.toISOString().split('T')[0]);
//     }
    
//     if (params.employeeIds && params.employeeIds.length > 0) {
//       params.employeeIds.forEach((employeeId) => {
//         searchParams.append('employeeIds', employeeId);
//       });
//     }
    
//     if (params.types && params.types.length > 0) {
//       params.types.forEach((type) => {
//         searchParams.append('types', type);
//       });
//     }
    
//     if (params.statuts && params.statuts.length > 0) {
//       params.statuts.forEach((statut) => {
//         searchParams.append('statuts', statut);
//       });
//     }
    
//     const url = `/personnel/conges/stats${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
//     console.log('📤 URL Stats:', url);
    
//     return api.request<ILeaveRequestStats>({
//       endpoint: url,
//       method: 'GET',
//     });
//   },

//   async exporterDemandesExcel(params: ILeaveRequestParams): Promise<Blob> {
//     return await api.request<Blob>({
//       endpoint: `/personnel/conges/export`,
//       method: 'GET',
//       searchParams: {
//         ...params,
//       } as SearchParams,
//     });
//   },
// };
