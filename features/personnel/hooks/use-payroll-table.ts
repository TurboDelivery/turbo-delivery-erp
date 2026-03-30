import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { createPayrollTableColumns } from '@/components/personnel/payroll/table/payroll-table-columns';
import { payrollFiltersClient } from '@/features/personnel/filters/payroll.filter';
import { usePayrollsQuery } from '@/features/personnel/queries/payroll.query';
import { IPayroll } from '@/features/personnel/types/payroll.types';

type PayrollFilters = {
  year: number;
  month: number;
};

type UsePayrollTableReturn = {
  payrollTable: ReturnType<typeof useReactTable<IPayroll>>;
  payrolls: IPayroll[];
  isPayrollLoading: boolean;
  isPayrollFetching: boolean;
  isPayrollError: boolean;
  filters: PayrollFilters;
  handleMonthFilterChange: (month: number) => void;
  handleYearFilterChange: (year: number) => void;
};

const clampMonth = (month: number): number => {
  if (Number.isNaN(month)) return new Date().getMonth() + 1;
  if (month < 1) return 1;
  if (month > 12) return 12;
  return month;
};

const normalizeYear = (year: number): number => {
  if (Number.isNaN(year) || year < 2000 || year > 2100) {
    return new Date().getFullYear();
  }

  return year;
};

const toYearMonthParam = (year: number, month: number): string => {
  const safeYear = normalizeYear(year);
  const safeMonth = clampMonth(month);
  return `${safeYear}-${String(safeMonth).padStart(2, '0')}`;
};

const extractYearMonth = (rawMonth: unknown, rawYear: unknown): PayrollFilters => {
  if (typeof rawMonth === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth)) {
    const [yearPart, monthPart] = rawMonth.split('-');
    return {
      year: normalizeYear(Number(yearPart)),
      month: clampMonth(Number(monthPart)),
    };
  }

  return {
    year: normalizeYear(Number(rawYear)),
    month: clampMonth(Number(rawMonth)),
  };
};

export function usePayrollTable(): UsePayrollTableReturn {
  const [rawFilters, rawSetFilters] = useQueryStates(payrollFiltersClient.filter, payrollFiltersClient.option);

  const filters = useMemo(() => {
    return extractYearMonth((rawFilters as { month?: unknown }).month, (rawFilters as { year?: unknown }).year);
  }, [rawFilters]);

  const currentSearchParams = useMemo(
    () => ({
      month: toYearMonthParam(filters.year, filters.month),
    }),
    [filters.year, filters.month],
  );

  const { data: payrollsData, isLoading, isFetching, isError } = usePayrollsQuery(currentSearchParams);

  const table = useReactTable({
    data: payrollsData || [],
    columns: createPayrollTableColumns(),
    getCoreRowModel: getCoreRowModel(),
  });

  const handleMonthFilterChange = (month: number) => {
    const nextMonth = clampMonth(month);
    rawSetFilters(
      {
        year: filters.year,
        month: nextMonth,
      } as never,
    );
  };

  const handleYearFilterChange = (year: number) => {
    const nextYear = normalizeYear(year);
    rawSetFilters(
      {
        year: nextYear,
        month: filters.month,
      } as never,
    );
  };

  return {
    payrollTable: table,
    payrolls: payrollsData || [],
    isPayrollLoading: isLoading,
    isPayrollFetching: isFetching,
    isPayrollError: isError,
    filters,
    handleMonthFilterChange,
    handleYearFilterChange,
  };
}

