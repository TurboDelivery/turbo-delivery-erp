import { useQuery } from '@tanstack/react-query';
import { employeeAPI } from '../apis/employee.api';

interface EmployeeStatsParams {
  debut?: Date;
  fin?: Date;
  departments?: string[];
  statuts?: string[];
  postes?: string[];
  search?: string;
}

interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  total_salary: number;
  average_salary: number;
}

export const useEmployeeStatsQuery = (params: EmployeeStatsParams) => {
  return useQuery({
    queryKey: ['employee-stats', params],
    queryFn: async (): Promise<EmployeeStats> => {
      try {
        // Récupérer toutes les données des employés
        const searchParams: any = {
          page: 0,
          limit: 1000, // Limite élevée pour obtenir tous les employés
        };
        
        const employeesResponse = await employeeAPI.obtenirTousEmployes(searchParams);
        const employees = employeesResponse.content || [];
        
        // Filtrer les employés selon les paramètres
        let filteredEmployees = employees;
        
        // Filtrer par départements
        if (params.departments && params.departments.length > 0) {
          filteredEmployees = filteredEmployees.filter(employee => 
            params.departments!.includes(employee.department || '')
          );
        }
        
        // Filtrer par statuts
        if (params.statuts && params.statuts.length > 0) {
          filteredEmployees = filteredEmployees.filter(employee => 
            params.statuts!.includes(employee.statut || '')
          );
        }
        
        // Filtrer par postes
        if (params.postes && params.postes.length > 0) {
          filteredEmployees = filteredEmployees.filter(employee => 
            params.postes!.includes(employee.position || '')
          );
        }
        
        // Filtrer par recherche
        if (params.search && params.search.trim()) {
          const searchTerm = params.search.toLowerCase().trim();
          filteredEmployees = filteredEmployees.filter(employee => 
            employee.name?.toLowerCase().includes(searchTerm) ||
            employee.email?.toLowerCase().includes(searchTerm) ||
            employee.position?.toLowerCase().includes(searchTerm) ||
            employee.department?.toLowerCase().includes(searchTerm)
          );
        }
        
        // Calculer les statistiques
        const totalEmployees = filteredEmployees.length;
        const activeEmployees = filteredEmployees.filter(emp => emp.statut === 'Actif').length;
        const totalSalary = filteredEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
        const averageSalary = totalEmployees > 0 ? totalSalary / totalEmployees : 0;
        
        return {
          total_employees: totalEmployees,
          active_employees: activeEmployees,
          total_salary: totalSalary,
          average_salary: averageSalary,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        // En cas d'erreur, retourner des valeurs par défaut
        return {
          total_employees: 0,
          active_employees: 0,
          total_salary: 0,
          average_salary: 0
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
};
