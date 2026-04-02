import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { createDeductionTableColumns } from '@/components/personnel/deductions/deductions/deduction-table-columns';
import { deductionFiltersClient } from '@/features/personnel/filters/deduction.filter';
import { useDeductionListQuery } from '@/features/personnel/queries/deduction-list.query';
import { IDeduction, IDeductionParams } from '@/features/personnel/types/deduction.types';

type UseDeductionTableOptions = {
  onEditDeduction?: (deduction: IDeduction) => void;
  onCancelDeduction?: (deduction: IDeduction) => void;
};

export function useDeductionTable({ onEditDeduction, onCancelDeduction }: UseDeductionTableOptions = {}) {
  const [filters, setFilters] = useQueryStates(deductionFiltersClient.filter, deductionFiltersClient.option);
  const columns = useMemo(() => createDeductionTableColumns({ onEditDeduction, onCancelDeduction }), [onCancelDeduction, onEditDeduction]);

  const currentSearchParams: IDeductionParams = useMemo(() => {
    return {
      employeeId: filters.employeeId || undefined,
      year: filters.year,
      month: filters.month,
    };
  }, [filters]);

  const { data: deductionsData, isLoading, isFetching, isError } = useDeductionListQuery(currentSearchParams);

  const table = useReactTable({
    data: deductionsData?.content || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: deductionsData?.totalPages || 0,
  });

  const pagination = {
    pageCount: deductionsData?.totalPages || 0,
    totalItems: deductionsData?.totalElements || 0,
    page: 0,
    handlePageChange: () => {},
  };

  const handleEmployeeFilterChange = (employeeId?: string | null) => {
    setFilters({ employeeId: employeeId || '' });
  };

  const handleYearFilterChange = (year?: number) => {
    if (!year || Number.isNaN(year)) return;
    setFilters({ year });
  };

  const handleMonthFilterChange = (month?: number) => {
    if (!month || Number.isNaN(month)) return;
    setFilters({ month });
  };

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
