// import { useQuery } from '@tanstack/react-query';
// import { deductionAPI, IDeductionParams } from '@/features/personnel/apis/deduction.api';
// import { Deduction } from '@/features/personnel/types/types';
// import { PaginatedResponse } from '@/types/general';

// export const useDeductionListQuery = (params: IDeductionParams) => {
//   return useQuery<PaginatedResponse<Deduction>>({
//     queryKey: ['deductions', params],
//     queryFn: () => deductionAPI.obtenirToutesDeductions(params),
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     refetchOnWindowFocus: false,
//   });
// };

// export const useDeductionQuery = (id: string) => {
//   return useQuery<Deduction>({
//     queryKey: ['deduction', id],
//     queryFn: () => deductionAPI.obtenirDeduction(id),
//     enabled: !!id,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };
