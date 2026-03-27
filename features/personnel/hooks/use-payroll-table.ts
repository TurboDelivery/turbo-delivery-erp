import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { createPayrollTableColumns } from '@/components/personnel/payroll/table/payroll-table-columns';
import { payrollFiltersClient } from '@/features/personnel/filters/payroll.filter';
import { usePayrollsQuery } from '@/features/personnel/queries/payroll.query';

const clampMonth = (month: number): number => {
  if (Number.isNaN(month)) return new Date().getMonth() + 1;
  if (month < 1) return 1;
  if (month > 12) return 12;
  return month;
};

export function usePayrollTable() {
  const [filters, setFilters] = useQueryStates(payrollFiltersClient.filter, payrollFiltersClient.option);

  const currentSearchParams = useMemo(
    () => ({
      month: clampMonth(filters.month),
    }),
    [filters.month],
  );

  const { data: payrollsData, isLoading, isFetching, isError } = usePayrollsQuery(currentSearchParams);

  const table = useReactTable({
    data: payrollsData || [],
    columns: createPayrollTableColumns(),
    getCoreRowModel: getCoreRowModel(),
  });

  const handleMonthFilterChange = (month: number) => {
    setFilters({ month: clampMonth(month) });
  };

  return {
    payrollTable: table,
    payrolls: payrollsData || [],
    isPayrollLoading: isLoading,
    isPayrollFetching: isFetching,
    isPayrollError: isError,
    filters,
    handleMonthFilterChange,
  };
}

