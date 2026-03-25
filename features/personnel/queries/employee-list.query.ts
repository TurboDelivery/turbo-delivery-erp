import { useQuery } from '@tanstack/react-query';
import { employeeAPI, IEmployeeParams, IEmployeeSalaryStats } from '@/features/personnel/apis/employee.api';
import { IEmployee } from '@/features/personnel/types/types';
import { PaginatedResponse } from '@/types/general';

export const useEmployeeListQuery = (params: IEmployeeParams) => {
  return useQuery<PaginatedResponse<IEmployee>>({
    queryKey: ['employees', params],
    queryFn: () => employeeAPI.obtenirTousEmployes(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useEmployeeQuery = (id: string) => {
  return useQuery<IEmployee>({
    queryKey: ['employee', id],
    queryFn: () => employeeAPI.obtenirEmploye(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
export const useEmployeeSalaryStatsQuery = () => {
  return useQuery<IEmployeeSalaryStats>({
    queryKey: ['employee-salary-stats'],
    queryFn: () => employeeAPI.employesStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};