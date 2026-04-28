import { IEmployee } from '@/features/personnel/types/types';
import { EmployeeCreateDTO, EmployeeUpdateDTO } from '@/features/personnel/schemas/employee.schema';
import { SearchParams } from 'ak-api-http';
import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/general';

export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV';

export interface IEmployeeExport {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  statut: string;
  entryDate: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  deductionsResume: string;
  totalDeductions: number;
  netToPay: number;
}

export interface IEmployeeAPI {
  obtenirTousEmployes(params: IEmployeeParams): Promise<PaginatedResponse<IEmployee>>;
  obtenirEmploye(id: string): Promise<IEmployee>;
  ajouterEmploye(data: EmployeeCreateDTO): Promise<IEmployee>;
  modifierEmploye(id: string, data: EmployeeUpdateDTO): Promise<IEmployee>;
  supprimerEmploye(id: string): Promise<IEmployee>;
  obtenirStatsEmployes(params: IEmployeeStatsParams): Promise<IEmployeeStats>;
  exporterEmployesExcel(params: IEmployeeParams): Promise<Blob>;
  exporterEmployes(params: IEmployeeParams & { format: ExportFormat }): Promise<IEmployeeExport[]>;
  employesStats(params?: IEmployeeParams): Promise<IEmployeeSalaryStats>;
  changeStatus(id: string, status: string): Promise<IEmployee>;
  syncJournaliers(): Promise<void>;
}

export interface IEmployeeParams {
  page?: number;
  limit?: number;
  department?: string;
  position?: string;
  statut?: string;
  dateEntree?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  search?: string;
}

export interface IEmployeeStats {
  nombre_total: number;
  nombre_actifs: number;
  nombre_inactifs: number;
  nombre_conge: number;
  salaire_moyen: number;
  nombre_departements: number;
}
export interface IEmployeeSalaryStats {
  totalEmployees: number;
  totalSalary: number;
  totalActiveEmployees: number;
}
export interface IEmployeeStatsParams {
  debut?: Date;
  fin?: Date;
  departments?: string[];
  statuts?: string[];
}

export const employeeAPI: IEmployeeAPI = {
  async obtenirTousEmployes(params: IEmployeeParams): Promise<PaginatedResponse<IEmployee>> {
    return await api.request<PaginatedResponse<IEmployee>>({
      endpoint: `/erp/employees`,
      method: 'GET',
      searchParams: {
        ...params,
        size: params.limit,
      } as SearchParams,
    });
  },

  async obtenirEmploye(id: string): Promise<IEmployee> {
    return await api.request<IEmployee>({
      endpoint: `/erp/employees/${id}`,
      method: 'GET',
    });
  },

  async ajouterEmploye(data: EmployeeCreateDTO): Promise<IEmployee> {
    // Ajouter les timestamps requis par la base de données
    const employeeData = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("📤 Données envoyées à l'API:", employeeData);

    return api
      .request<IEmployee>({
        endpoint: `/erp/employees`,
        method: 'POST',
        data: employeeData,
      })
      .then((response) => {
        console.log('📥 Réponse API ajouterEmploye:', response);
        return response;
      })
      .catch((error) => {
        console.error('❌ Erreur API ajouterEmploye:', error);
        throw error;
      });
  },

  async modifierEmploye(id: string, data: EmployeeUpdateDTO): Promise<IEmployee> {
    // Ajouter le timestamp de mise à jour
    const employeeData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    return api.request<IEmployee>({
      endpoint: `/erp/employees/${id}`,
      method: 'PUT',
      data: employeeData,
    });
  },

  async supprimerEmploye(id: string): Promise<IEmployee> {
    return api.request<IEmployee>({
      endpoint: `/erp/employees/${id}`,
      method: 'DELETE',
    });
  },

  async obtenirStatsEmployes(params: IEmployeeStatsParams): Promise<IEmployeeStats> {
    console.log('🌐 API - Appel obtenirStatsEmployes avec:', params);

    const searchParams = new URLSearchParams();

    if (params.debut) {
      searchParams.append('debut', params.debut.toISOString().split('T')[0]);
    }

    if (params.fin) {
      searchParams.append('fin', params.fin.toISOString().split('T')[0]);
    }

    if (params.departments && params.departments.length > 0) {
      params.departments.forEach((department) => {
        searchParams.append('departmentIds', department);
      });
    }

    if (params.statuts && params.statuts.length > 0) {
      params.statuts.forEach((statut) => {
        searchParams.append('statuts', statut);
      });
    }

    const url = `/personnel/employes/stats${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    console.log('📤 URL Stats:', url);

    return api.request<IEmployeeStats>({
      endpoint: url,
      method: 'GET',
    });
  },

  async exporterEmployesExcel(params: IEmployeeParams): Promise<Blob> {
    return await api.request<Blob>({
      endpoint: `/personnel/employes/export`,
      method: 'GET',
      searchParams: {
        ...params,
      } as SearchParams,
    });
  },

  async exporterEmployes(params: IEmployeeParams & { format: ExportFormat }): Promise<IEmployeeExport[]> {
    return await api.request<IEmployeeExport[]>({
      endpoint: `/erp/employees/export`,
      method: 'GET',
      searchParams: {
        ...params,
      } as SearchParams,
    });
  },

  async employesStats(params?: IEmployeeParams): Promise<IEmployeeSalaryStats> {
    return api.request<IEmployeeSalaryStats>({
      endpoint: `/erp/employees/stats`,
      method: 'GET',
      searchParams: params ? { ...params } as SearchParams : undefined,
    });
  },

  async changeStatus(id: string, status: string): Promise<IEmployee> {
    return api.request<IEmployee>({
      endpoint: `/erp/employees/${id}/status`,
      method: 'PATCH',
      data: { status },
    });
  },

  async syncJournaliers(): Promise<void> {
    return api.request<void>({
      endpoint: `/erp/employees/sync-journaliers`,
      method: 'POST',
    });
  },
};
