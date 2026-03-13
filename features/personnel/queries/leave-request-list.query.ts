// import { useQuery } from '@tanstack/react-query';
// import { leaveRequestAPI, ILeaveRequestParams } from '@/features/personnel/apis/leave-request.api';
// import { LeaveRequest } from '@/features/personnel/types/types';
// import { PaginatedResponse } from '@/types/general';

// export const useLeaveRequestListQuery = (params: ILeaveRequestParams) => {
//   return useQuery<PaginatedResponse<LeaveRequest>>({
//     queryKey: ['leave-requests', params],
//     queryFn: () => leaveRequestAPI.obtenirToutesDemandes(params),
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     refetchOnWindowFocus: false,
//   });
// };

// export const useLeaveRequestQuery = (id: string) => {
//   return useQuery<LeaveRequest>({
//     queryKey: ['leave-request', id],
//     queryFn: () => leaveRequestAPI.obtenirDemande(id),
//     enabled: !!id,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };
