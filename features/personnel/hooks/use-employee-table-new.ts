import { useEmployeeListQuery } from '@/features/personnel/queries/employee-list.query';
import { employeeColumns } from '@/components/personnel/employee-table/employee-columns';
import React, { useMemo, useState } from 'react';
import { getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { type GenericTableFilters } from '@/hooks/use-generic-table';

interface EmployeeFilters extends GenericTableFilters {
  debut?: Date;
  fin?: Date;
  departments?: string[] | null;
  statuts?: string[] | null;
  postes?: string[] | null;
  search?: string;
}

const initialFilters: EmployeeFilters = {
  departments: null,
  statuts: null,
  postes: null,
  search: '',
  limit: 20,
  page: 0,
  orderBy: undefined,
  orderDirection: 'desc',
};

export const useEmployeeTableNew = (externalFilters?: EmployeeFilters) => {
  const [filters, setFilters] = useState<EmployeeFilters>({
    ...initialFilters,
    debut: startOfMonth(new Date()),
    fin: new Date(),
    ...externalFilters, // Appliquer les filtres externes au démarrage
  });

  // Utiliser uniquement les filtres locaux (déjà synchronisés avec externes au démarrage)
  const currentFilters = filters;

  const [sorting, setSorting] = React.useState<SortingState>(() => {
    const orderBy = filters?.orderBy;
    const orderDirection = filters?.orderDirection ?? 'desc';
    return orderBy ? [{ id: orderBy, desc: orderDirection === 'desc' }] : [];
  });

  React.useEffect(() => {
    const orderBy = filters?.orderBy;
    const orderDirection = filters?.orderDirection ?? 'desc';
    const next = orderBy ? [{ id: orderBy, desc: orderDirection === 'desc' }] : [];
    setSorting((prev) => {
      const prevFirst = prev[0];
      const nextFirst = next[0];
      if (prevFirst?.id === nextFirst?.id && prevFirst?.desc === nextFirst?.desc) return prev;
      return next;
    });
  }, [filters?.orderBy, filters?.orderDirection]);

  const currentSearchParams = useMemo(() => {
    return {
      page: currentFilters?.page ?? 0,
      limit: currentFilters?.limit ?? 20,
      debut: currentFilters.debut,
      fin: currentFilters.fin,
      orderBy: currentFilters.orderBy,
      orderDirection: currentFilters.orderDirection as 'asc' | 'desc' | undefined,
    };
  }, [currentFilters?.page, currentFilters?.limit, currentFilters.debut, currentFilters.fin, currentFilters.orderBy, currentFilters.orderDirection]);

  const { data: employeesData, isLoading: employeesLoading, error, isError, isFetching } = useEmployeeListQuery(currentSearchParams);
  const employees = employeesData?.content || [];

  // Filtrer les employés selon les filtres appliqués
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Filtrer par recherche
    if (currentFilters.search && currentFilters.search.trim()) {
      const searchTerm = currentFilters.search.toLowerCase().trim();
      filtered = filtered.filter(employee => 
        employee.name?.toLowerCase().includes(searchTerm) ||
        employee.email?.toLowerCase().includes(searchTerm) ||
        employee.position?.toLowerCase().includes(searchTerm) ||
        employee.department?.toLowerCase().includes(searchTerm)
      );
    }

    if (currentFilters.departments && currentFilters.departments.length > 0) {
      filtered = filtered.filter(employee => 
        currentFilters.departments?.includes(employee.department || '')
      );
    }

    if (currentFilters.statuts && currentFilters.statuts.length > 0) {
      filtered = filtered.filter(employee => 
        currentFilters.statuts?.includes(employee.statut || '')
      );
    }

    if (currentFilters.postes && currentFilters.postes.length > 0) {
      filtered = filtered.filter(employee => 
        currentFilters.postes?.includes(employee.position || '')
      );
    }

    return filtered;
  }, [employees, currentFilters.search, currentFilters.departments, currentFilters.statuts, currentFilters.postes]);

  // Simuler la pagination pour les données filtrées
  const paginatedFilteredEmployees = useMemo(() => {
    const startIndex = (currentFilters?.page ?? 0) * (currentFilters?.limit ?? 20);
    const endIndex = startIndex + (currentFilters?.limit ?? 20);
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentFilters?.page, currentFilters?.limit]);

  // Recalculer la pagination pour les données filtrées
  const filteredPagination = useMemo(() => {
    const totalItems = filteredEmployees.length;
    const pageSize = currentFilters?.limit ?? 20;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    return {
      pageCount: totalPages,
      totalItems,
      page: currentFilters?.page ?? 0,
      handlePageChange: (page: number) => {
        setFilters((prev) => ({
          ...prev,
          page: page - 1,
        }));
      },
    };
  }, [filteredEmployees, currentFilters?.page, currentFilters?.limit]);

  // Utiliser la pagination filtrée si filtres locaux, sinon pagination API
  const pagination = (currentFilters.departments || currentFilters.statuts || currentFilters.postes || currentFilters.search) 
    ? filteredPagination 
    : {
        pageCount: employeesData?.totalPages || 0,
        totalItems: employeesData?.totalElements || 0,
        page: currentFilters?.page ?? 0,
        handlePageChange: (page: number) => {
          setFilters((prev) => ({
            ...prev,
            page: page - 1,
          }));
        },
      };

  const isLoading = employeesLoading;

  // Synchroniser les filtres locaux avec les filtres globaux
  const syncedSetFilters = (fn: (prev: EmployeeFilters) => EmployeeFilters) => {
    setFilters(fn);
  };

  const setSelectedDepartments = (departments: string[] | null) => {
    syncedSetFilters((prev) => ({
      ...prev,
      departments,
      page: 0, // Reset to first page when filters change
    }));
  };

  const setSelectedStatuts = (statuts: string[] | null) => {
    syncedSetFilters((prev) => ({
      ...prev,
      statuts,
      page: 0, // Reset to first page when filters change
    }));
  };

  const setSelectedPostes = (postes: string[] | null) => {
    syncedSetFilters((prev) => ({
      ...prev,
      postes,
      page: 0, // Reset to first page when filters change
    }));
  };

  const handleSearchChange = (search: string) => {
    syncedSetFilters((prev) => ({
      ...prev,
      search,
      page: 0, // Reset to first page when search changes
    }));
  };

  const handleDateChange = (value: DateRange | undefined) => {
    if (value?.from && value?.to) {
      setFilters((prev) => ({
        ...prev,
        debut: value.from,
        fin: value.to,
      }));
    }
  };

  const table = useReactTable({
    columns: employeeColumns,
    data: (currentFilters.departments || currentFilters.statuts || currentFilters.postes || currentFilters.search) ? paginatedFilteredEmployees : employees,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    state: {
      pagination: {
        pageIndex: pagination.page,
        pageSize: filters?.limit ?? 50,
      },
      sorting,
    },
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const first = next[0];
        setFilters((prevFilters) => ({
          ...prevFilters,
          orderBy: first?.id ?? undefined,
          orderDirection: first ? (first.desc ? 'desc' : 'asc') : undefined,
          page: 0,
        }));
        return next;
      });
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' ? updater(table.getState().pagination) : updater;
      setFilters((prev) => ({
        ...prev,
        page: newState.pageIndex,
        limit: newState.pageSize,
      }));
    },
    meta: {
      // Passer les callbacks via le meta pour y accéder dans les colonnes
      onEdit: externalFilters?.onEdit,
      onDeactivate: externalFilters?.onDeactivate,
      onRemove: externalFilters?.onRemove,
    },
  });

  return {
    table,
    isLoading,
    isError,
    isFetching,
    setFilters: syncedSetFilters,
    employees: (currentFilters.departments || currentFilters.statuts || currentFilters.postes || currentFilters.search) ? paginatedFilteredEmployees : employees,
    employeesData,
    error,
    filters: currentFilters,
    setSelectedDepartments,
    setSelectedStatuts,
    setSelectedPostes,
    handleSearchChange,
    pagination,
    handleDateChange,
  };
};
