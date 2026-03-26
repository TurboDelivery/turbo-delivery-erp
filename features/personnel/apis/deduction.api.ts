import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/general';
import { CreateAbsenceDeductionDTO, CreateAvanceDTO, CreatePretDTO } from '@/features/personnel/schemas/deduction.schema';
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
}

const resolveYearMonth = (raw: unknown): { year: number; month: number } => {
  const data = raw as { year?: number; month?: number; date?: string };

  if (typeof data?.year === 'number' && typeof data?.month === 'number') {
    return { year: data.year, month: data.month };
  }

  if (typeof data?.date === 'string' && data.date) {
    const parsed = new Date(`${data.date}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return { year: parsed.getFullYear(), month: parsed.getMonth() + 1 };
    }
  }

  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const buildQueryString = (params: Record<string, string | number>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  return searchParams.toString();
};

export const deductionAPI: IDeductionAPI = {
  obtenirDeductions(params?: IDeductionParams): Promise<PaginatedResponse<IDeduction>> {
    const year = (params as { year?: number } | undefined)?.year ?? new Date().getFullYear();
    const month = (params as { month?: number } | undefined)?.month ?? new Date().getMonth() + 1;

    return api.request<PaginatedResponse<IDeduction>>({
      endpoint: '/erp/deductions/monthly',
      method: 'GET',
      searchParams: {
        employeeId: params?.employeeId,
        year,
        month,
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
    console.log('Creating absence deduction with data:', data);
    return api.request<ICreateAbsenceDeductionResponse>({
      endpoint: `/erp/deductions/absence`,
      method: 'POST',
      data,
    });
  },
};
