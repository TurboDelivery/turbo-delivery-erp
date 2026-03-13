// import { useLeaveRequestListQuery } from '@/features/personnel/queries/leave-request-list.query';
// import { type GenericTableFilters } from '@/hooks/use-generic-table';
// import { leaveRequestColumns } from '@/components/personnel/leave-request-table/leave-request-columns';
// import React, { useMemo, useState } from 'react';
// import { getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
// import { startOfMonth } from 'date-fns';
// import { DateRange } from 'react-day-picker';
// import { LeaveRequest } from '@/features/personnel/types/types';

// interface LeaveRequestFilters extends GenericTableFilters {
//   debut?: Date;
//   fin?: Date;
//   employeeIds?: string[] | null;
//   types?: string[] | null;
//   statuts?: string[] | null;
// }

// const initialFilters: LeaveRequestFilters = {
//   employeeIds: null,
//   types: null,
//   statuts: null,
//   limit: 20,
//   page: 0,
//   orderBy: undefined,
//   orderDirection: 'desc',
// };

// export const useLeaveRequestTable = (externalFilters?: LeaveRequestFilters) => {
//   const [filters, setFilters] = useState<LeaveRequestFilters>({
//     ...initialFilters,
//     debut: startOfMonth(new Date()),
//     fin: new Date(),
//   });

//   // Utiliser les filtres externes s'ils sont fournis, sinon utiliser les filtres locaux
//   const currentFilters = externalFilters || filters;

//   const [sorting, setSorting] = React.useState<SortingState>(() => {
//     const orderBy = filters?.orderBy;
//     const orderDirection = filters?.orderDirection ?? 'desc';
//     return orderBy ? [{ id: orderBy, desc: orderDirection === 'desc' }] : [];
//   });

//   React.useEffect(() => {
//     const orderBy = filters?.orderBy;
//     const orderDirection = filters?.orderDirection ?? 'desc';
//     const next = orderBy ? [{ id: orderBy, desc: orderDirection === 'desc' }] : [];
//     setSorting((prev) => {
//       const prevFirst = prev[0];
//       const nextFirst = next[0];
//       if (prevFirst?.id === nextFirst?.id && prevFirst?.desc === nextFirst?.desc) return prev;
//       return next;
//     });
//   }, [filters?.orderBy, filters?.orderDirection]);

//   const currentSearchParams = useMemo(() => {
//     return {
//       page: currentFilters?.page ?? 0,
//       limit: currentFilters?.limit ?? 20,
//       debut: currentFilters.debut,
//       fin: currentFilters.fin,
//       orderBy: currentFilters.orderBy,
//       orderDirection: currentFilters.orderDirection as 'asc' | 'desc' | undefined,
//     };
//   }, [currentFilters?.page, currentFilters?.limit, currentFilters.debut, currentFilters.fin, currentFilters.orderBy, currentFilters.orderDirection]);

//   const { data: leaveRequestsData, isLoading: leaveRequestsLoading, error, isError, isFetching } = useLeaveRequestListQuery(currentSearchParams);
//   const leaveRequests = leaveRequestsData?.content || [];

//   // Filtrer localement si nécessaire
//   const filteredLeaveRequests = useMemo(() => {
//     let filtered = leaveRequests;

//     if (currentFilters.employeeIds && currentFilters.employeeIds.length > 0) {
//       filtered = filtered.filter(leaveRequest => 
//         currentFilters.employeeIds?.includes(leaveRequest.employeeId || '')
//       );
//     }

//     if (currentFilters.types && currentFilters.types.length > 0) {
//       filtered = filtered.filter(leaveRequest => 
//         currentFilters.types?.includes(leaveRequest.type || '')
//       );
//     }

//     if (currentFilters.statuts && currentFilters.statuts.length > 0) {
//       filtered = filtered.filter(leaveRequest => 
//         currentFilters.statuts?.includes(leaveRequest.statut || '')
//       );
//     }

//     return filtered;
//   }, [leaveRequests, currentFilters.employeeIds, currentFilters.types, currentFilters.statuts]);

//   // Simuler la pagination pour les données filtrées
//   const paginatedFilteredLeaveRequests = useMemo(() => {
//     const startIndex = (currentFilters?.page ?? 0) * (currentFilters?.limit ?? 20);
//     const endIndex = startIndex + (currentFilters?.limit ?? 20);
//     return filteredLeaveRequests.slice(startIndex, endIndex);
//   }, [filteredLeaveRequests, currentFilters?.page, currentFilters?.limit]);

//   // Recalculer la pagination pour les données filtrées
//   const filteredPagination = useMemo(() => {
//     const totalItems = filteredLeaveRequests.length;
//     const pageSize = currentFilters?.limit ?? 20;
//     const totalPages = Math.ceil(totalItems / pageSize);
    
//     return {
//       pageCount: totalPages,
//       totalItems,
//       page: currentFilters?.page ?? 0,
//       handlePageChange: (page: number) => {
//         if (!externalFilters) {
//           setFilters((prev) => ({
//             ...prev,
//             page: page - 1,
//           }));
//         }
//       },
//     };
//   }, [filteredLeaveRequests, currentFilters?.page, currentFilters?.limit, externalFilters, setFilters]);

//   // Utiliser la pagination filtrée si filtres locaux, sinon pagination API
//   const pagination = (currentFilters.employeeIds || currentFilters.types || currentFilters.statuts) 
//     ? filteredPagination 
//     : {
//         pageCount: leaveRequestsData?.totalPages || 0,
//         totalItems: leaveRequestsData?.totalElements || 0,
//         page: currentFilters?.page ?? 0,
//         handlePageChange: (page: number) => {
//           if (!externalFilters) {
//             setFilters((prev) => ({
//               ...prev,
//               page: page - 1,
//             }));
//           }
//         },
//       };

//   const isLoading = leaveRequestsLoading;

//   // Synchroniser les filtres locaux avec les filtres globaux
//   const syncedSetFilters = (fn: (prev: LeaveRequestFilters) => LeaveRequestFilters) => {
//     const newFilters = fn(filters as unknown as LeaveRequestFilters);
//     setFilters(newFilters as typeof filters);
//   };

//   const setSelectedEmployeeIds = (employeeIds: string[] | null) => {
//     syncedSetFilters((prev) => ({
//       ...prev,
//       employeeIds,
//       page: 0, // Reset to first page when filters change
//     }));
//   };

//   const setSelectedTypes = (types: string[] | null) => {
//     syncedSetFilters((prev) => ({
//       ...prev,
//       types,
//       page: 0, // Reset to first page when filters change
//     }));
//   };

//   const setSelectedStatuts = (statuts: string[] | null) => {
//     syncedSetFilters((prev) => ({
//       ...prev,
//       statuts,
//       page: 0, // Reset to first page when filters change
//     }));
//   };

//   const handleDateChange = (value: DateRange | undefined) => {
//     if (value?.from && value?.to) {
//       setFilters((prev) => ({
//         ...prev,
//         debut: value.from,
//         fin: value.to,
//       }));
//     }
//   };

//   const table = useReactTable({
//     columns: leaveRequestColumns,
//     data: (currentFilters.employeeIds || currentFilters.types || currentFilters.statuts) ? paginatedFilteredLeaveRequests : leaveRequests,
//     getCoreRowModel: getCoreRowModel(),
//     manualPagination: true,
//     manualSorting: true,
//     state: {
//       pagination: {
//         pageIndex: pagination.page,
//         pageSize: filters?.limit ?? 50,
//       },
//       sorting,
//     },
//     onSortingChange: (updater) => {
//       setSorting((prev) => {
//         const next = typeof updater === 'function' ? updater(prev) : updater;
//         const first = next[0];
//         setFilters((prevFilters) => ({
//           ...prevFilters,
//           orderBy: first?.id ?? undefined,
//           orderDirection: first ? (first.desc ? 'desc' : 'asc') : undefined,
//           page: 0,
//         }));
//         return next;
//       });
//     },
//     onPaginationChange: (updater) => {
//       const newState = typeof updater === 'function' ? updater(table.getState().pagination) : updater;
//       setFilters((prev) => ({
//         ...prev,
//         page: newState.pageIndex,
//         limit: newState.pageSize,
//       }));
//     },
//   });

//   return {
//     table,
//     isLoading,
//     isError,
//     isFetching,
//     setFilters: syncedSetFilters,
//     leaveRequests: (currentFilters.employeeIds || currentFilters.types || currentFilters.statuts) ? paginatedFilteredLeaveRequests : leaveRequests,
//     leaveRequestsData,
//     error,
//     filters: currentFilters,
//     setSelectedEmployeeIds,
//     setSelectedTypes,
//     setSelectedStatuts,
//     pagination,
//     handleDateChange,
//   };
// };
