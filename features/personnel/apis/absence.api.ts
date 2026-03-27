import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/general';
import { IAbsence, IAbsenceParams, IAbsencePayload } from '@/features/personnel/types/absence.types';

export interface IAbsenceAPI {
  obtenirAbsences(params?: IAbsenceParams): Promise<PaginatedResponse<IAbsence>>;
  ajouterAbsence(data: IAbsencePayload): Promise<IAbsence>;
  modifierAbsence(id: string, data: IAbsencePayload): Promise<IAbsence>;
}

export const absenceAPI: IAbsenceAPI = {
  obtenirAbsences(params?: IAbsenceParams): Promise<PaginatedResponse<IAbsence>> {
    return api.request<PaginatedResponse<IAbsence>>({
      endpoint: 'erp/absences',
      method: 'GET',
      searchParams: params as SearchParams,
    });
  },

  ajouterAbsence(data: IAbsencePayload): Promise<IAbsence> {
    return api.request<IAbsence>({
      endpoint: 'erp/absences',
      method: 'POST',
      data,
    });
  },

  modifierAbsence(id: string, data: IAbsencePayload): Promise<IAbsence> {
    return api.request<IAbsence>({
      endpoint: `erp/absences/${id}`,
      method: 'PUT',
      data,
    });
  },
};

