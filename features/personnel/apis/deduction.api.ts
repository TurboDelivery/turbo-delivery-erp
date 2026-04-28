import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/general';
import {
  CreateAbsenceDeductionDTO,
  CreateAvanceDTO,
  CreatePretDTO,
  UpdateAbsenceDeductionDTO,
  UpdateAvanceDTO,
  UpdatePretDTO,
} from '@/features/personnel/schemas/deduction.schema';
import {
  ICreateAbsenceDeductionResponse,
  ICreateAvanceResponse,
  ICreatePretResponse,
  IDeduction,
  IDeductionParams,
} from '@/features/personnel/types/deduction.types';

export interface IDeductionAPI {
  obtenirDeductions(params?: IDeductionParams): Promise<PaginatedResponse<IDeduction>>;
  payMonthlyDeductions(data: { employeeId: string; year: number; month: number }): Promise<IDeduction[]>;
  createPret(data: CreatePretDTO): Promise<ICreatePretResponse>;
  createAvance(data: CreateAvanceDTO): Promise<ICreateAvanceResponse>;
  createAbsenceDeduction(data: CreateAbsenceDeductionDTO): Promise<ICreateAbsenceDeductionResponse>;
  updateAvance(deductionId: string, data: UpdateAvanceDTO): Promise<ICreateAvanceResponse>;
  updatePret(referenceId: string, data: UpdatePretDTO): Promise<ICreatePretResponse>;
  updateAbsenceDeduction(deductionId: string, data: UpdateAbsenceDeductionDTO): Promise<ICreateAbsenceDeductionResponse>;
  cancelDeduction(deductionId: string): Promise<IDeduction>;
  supprimerDeduction(deductionId: string): Promise<void>;
}

const buildQueryString = (params: Record<string, string | number>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  return searchParams.toString();
};

export const deductionAPI: IDeductionAPI = {
  obtenirDeductions(params?: IDeductionParams): Promise<PaginatedResponse<IDeduction>> {
    const year = params?.year ?? new Date().getFullYear();
    const month = params?.month ?? new Date().getMonth() + 1;

    return api.request<PaginatedResponse<IDeduction>>({
      endpoint: '/erp/deductions/monthly',
      method: 'GET',
      searchParams: {
        employeeId: params?.employeeId,
        year,
        month,
        page: Math.max(0, params?.page ?? 0),
        size: params?.size ?? 10,
      } as SearchParams,
    });
  },

  payMonthlyDeductions(data: { employeeId: string; year: number; month: number }): Promise<IDeduction[]> {
    const query = buildQueryString({
      employeeId: data.employeeId,
      year: data.year,
      month: data.month,
    });

    return api.request<IDeduction[]>({
      endpoint: `/erp/deductions/pay/${data.employeeId}?${query}`,
      method: 'PATCH',
    });
  },

  createPret(data: CreatePretDTO): Promise<ICreatePretResponse> {
    return api.request<ICreatePretResponse>({
      endpoint: `/erp/deductions/pret`,
      method: 'POST',
      data
    });
  },

  createAvance(data: CreateAvanceDTO): Promise<ICreateAvanceResponse> {
    return api.request<ICreateAvanceResponse>({
      endpoint: `/erp/deductions/avance`,
      method: 'POST',
      data,
    });
  },

  createAbsenceDeduction(data: CreateAbsenceDeductionDTO): Promise<ICreateAbsenceDeductionResponse> {
    return api.request<ICreateAbsenceDeductionResponse>({
      endpoint: `/erp/deductions/absence`,
      method: 'POST',
      data,
    });
  },

  updateAvance(deductionId: string, data: UpdateAvanceDTO): Promise<ICreateAvanceResponse> {
    return api.request<ICreateAvanceResponse>({
      endpoint: `/erp/deductions/avance/${deductionId}`,
      method: 'PUT',
      data,
    });
  },

  updatePret(referenceId: string, data: UpdatePretDTO): Promise<ICreatePretResponse> {
    return api.request<ICreatePretResponse>({
      endpoint: `/erp/deductions/pret/${referenceId}`,
      method: 'PUT',
      data,
    });
  },

  updateAbsenceDeduction(deductionId: string, data: UpdateAbsenceDeductionDTO): Promise<ICreateAbsenceDeductionResponse> {
    return api.request<ICreateAbsenceDeductionResponse>({
      endpoint: `/erp/deductions/absence/${deductionId}`,
      method: 'PUT',
      data,
    });
  },

  cancelDeduction(deductionId: string): Promise<IDeduction> {
    return api.request<IDeduction>({
      endpoint: `/erp/deductions/cancel/${deductionId}`,
      method: 'PATCH',
    });
  },

  supprimerDeduction(deductionId: string): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/deductions/${deductionId}`,
      method: 'DELETE',
    });
  },
};
