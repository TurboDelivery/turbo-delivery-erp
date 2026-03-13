
// import { SearchParams } from 'ak-api-http';
// import { api } from '@/lib/api';
// import { PaginatedResponse } from '@/types/general';
// import { DeductionCreateDTO, DeductionUpdateDTO } from '../schemas/deduction.schema';
// import { Deduction } from '../types/types';

// export interface IDeductionAPI {
//   obtenirToutesDeductions(params: IDeductionParams): Promise<PaginatedResponse<Deduction>>;
//   obtenirDeduction(id: string): Promise<Deduction>;
//   ajouterDeduction(data: DeductionCreateDTO): Promise<Deduction>;
//   modifierDeduction(id: string, data: DeductionUpdateDTO): Promise<Deduction>;
//   supprimerDeduction(id: string): Promise<Deduction>;
//   appliquerDeduction(id: string): Promise<Deduction>;
//   obtenirStatsDeductions(params: IDeductionStatsParams): Promise<IDeductionStats>;
//   exporterDeductionsExcel(params: IDeductionParams): Promise<Blob>;
// }

// export interface IDeductionParams {
//   page?: number;
//   limit?: number;
//   employeeId?: string;
//   type?: string;
//   statut?: string;
//   date?: string;
//   dateDebut?: string;
//   dateFin?: string;
//   orderBy?: string;
//   orderDirection?: 'asc' | 'desc';
// }

// export interface IDeductionStats {
//   nombre_total: number;
//   montant_total_ce_mois: number;
//   montant_en_attente: number;
//   nombre_appliquees: number;
//   nombre_en_attente: number;
//   montant_total_applique: number;
// }

// export interface IDeductionStatsParams {
//   debut?: Date;
//   fin?: Date;
//   employeeIds?: string[];
//   types?: string[];
//   statuts?: string[];
// }

// export const deductionAPI: IDeductionAPI = {
//   async obtenirToutesDeductions(params: IDeductionParams): Promise<PaginatedResponse<Deduction>> {
//     return await api.request<PaginatedResponse<Deduction>>({
//       endpoint: `/personnel/deductions/pagination`,
//       method: 'GET',
//       searchParams: {
//         ...params,
//       } as SearchParams,
//     });
//   },

//   async obtenirDeduction(id: string): Promise<Deduction> {
//     return await api.request<Deduction>({
//       endpoint: `/personnel/deductions/${id}`,
//       method: 'GET',
//     });
//   },

//   async ajouterDeduction(data: DeductionCreateDTO): Promise<Deduction> {
//     console.log('🌐 API - Appel ajouterDeduction avec:', data);
    
//     return api.request<Deduction>({
//       endpoint: `/personnel/deductions`,
//       method: 'POST',
//       data,
//     }).then(response => {
//       console.log('📥 Réponse API ajouterDeduction:', response);
//       return response;
//     }).catch(error => {
//       console.error('❌ Erreur API ajouterDeduction:', error);
//       throw error;
//     });
//   },

//   async modifierDeduction(id: string, data: DeductionUpdateDTO): Promise<Deduction> {
//     return api.request<Deduction>({
//       endpoint: `/personnel/deductions/${id}`,
//       method: 'PUT',
//       data,
//     });
//   },

//   async supprimerDeduction(id: string): Promise<Deduction> {
//     return api.request<Deduction>({
//       endpoint: `/personnel/deductions/${id}`,
//       method: 'DELETE',
//     });
//   },

//   async appliquerDeduction(id: string): Promise<Deduction> {
//     return api.request<Deduction>({
//       endpoint: `/personnel/deductions/${id}/appliquer`,
//       method: 'POST',
//     });
//   },

//   async obtenirStatsDeductions(params: IDeductionStatsParams): Promise<IDeductionStats> {
//     console.log('🌐 API - Appel obtenirStatsDeductions avec:', params);
    
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
    
//     const url = `/personnel/deductions/stats${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
//     console.log('📤 URL Stats:', url);
    
//     return api.request<IDeductionStats>({
//       endpoint: url,
//       method: 'GET',
//     });
//   },

//   async exporterDeductionsExcel(params: IDeductionParams): Promise<Blob> {
//     return await api.request<Blob>({
//       endpoint: `/personnel/deductions/export`,
//       method: 'GET',
//       searchParams: {
//         ...params,
//       } as SearchParams,
//     });
//   },
// };
