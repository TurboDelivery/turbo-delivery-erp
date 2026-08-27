import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { createDeductionTableColumns } from '@/components/personnel/deductions/deductions/deduction-table-columns';
import { deductionFiltersClient } from '@/features/personnel/filters/deduction.filter';
import { useDeductionListQuery } from '@/features/personnel/queries/deduction-list.query';
import { IDeduction, IDeductionParams } from '@/features/personnel/types/deduction.types';

type UseDeductionTableOptions = {
  onEditDeduction?: (deduction: IDeduction) => void;
  onCancelDeduction?: (deduction: IDeduction) => void;
  onDeleteDeduction?: (deduction: IDeduction) => void;
};

export function useDeductionTable({ onEditDeduction, onCancelDeduction, onDeleteDeduction }: UseDeductionTableOptions = {}) {
  const [filters, setFilters] = useQueryStates(deductionFiltersClient.filter, deductionFiltersClient.option);
  const columns = useMemo(
    () => createDeductionTableColumns({ onEditDeduction, onCancelDeduction, onDeleteDeduction }),
    [onCancelDeduction, onDeleteDeduction, onEditDeduction],
  );

  const currentSearchParams: IDeductionParams = useMemo(() => ({
    employeeId: filters.employeeId || undefined,
    year: filters.year,
    month: filters.month,
    page: Math.max(0, filters.page ?? 0),
    size: 10,
  }), [filters]);

  const { data: deductionsData, isLoading, isFetching, isError } = useDeductionListQuery(currentSearchParams);

  const table = useReactTable({
    data: deductionsData?.content || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: deductionsData?.totalPages || 0,
  });

  const handlePageChange = useCallback(
    (page: number) => {
      // HeroUI Pagination is 1-based, API is 0-based
      setFilters({ page: page - 1 });
    },
    [setFilters],
  );

  const pagination = {
    pageCount: deductionsData?.totalPages || 0,
    totalItems: deductionsData?.totalElements || 0,
    page: Math.max(0, filters.page ?? 0),
    handlePageChange,
  };

  const handleEmployeeFilterChange = useCallback(
    (employeeId?: string | null) => {
      setFilters({ employeeId: employeeId || '', page: 0 });
    },
    [setFilters],
  );

  const handleYearFilterChange = useCallback(
    (year?: number) => {
      if (!year || Number.isNaN(year)) return;
      setFilters({ year, page: 0 });
    },
    [setFilters],
  );

  const handleMonthFilterChange = useCallback(
    (month?: number) => {
      if (!month || Number.isNaN(month)) return;
      setFilters({ month, page: 0 });
    },
    [setFilters],
  );

  return {
    deductionTable: table,
    deductions: deductionsData,
    isDeductionLoading: isLoading,
    isDeductionFetching: isFetching,
    isDeductionError: isError,
    pagination,
    filters,
    setFilters,
    handleEmployeeFilterChange,
    handleYearFilterChange,
    handleMonthFilterChange,
  };
}
