import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { LeaveRequest } from '@/features/personnel/types/types';
import { PaginatedResponse } from '@/types/general';

export interface ILeaveRequestParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  type?: string;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export const leaveRequestAPI = {
  async obtenirToutesDemandes(params: ILeaveRequestParams): Promise<PaginatedResponse<LeaveRequest>> {
    return await api.request<PaginatedResponse<LeaveRequest>>({
      endpoint: `/personnel/conges/pagination`,
      method: 'GET',
      searchParams: { ...params } as SearchParams,
    });
  },
};
