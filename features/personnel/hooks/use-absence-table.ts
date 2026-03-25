import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import { useQueryStates } from 'nuqs';
import { createAbsenceTableColumns } from '@/components/personnel/deductions/absences/absence-table-columns';
import { absenceFiltersClient } from '@/features/personnel/filters/absence.filter';
import { useAbsencesQuery } from '@/features/personnel/queries/absence.query';
import { AbsenceTypeEnum, IAbsence, IAbsenceParams } from '@/features/personnel/types/absence.types';

const formatDateParam = (date?: Date): string | undefined => {
  if (!date || Number.isNaN(date.getTime())) {
    return undefined;
  }

  return format(date, 'yyyy-MM-dd');
};

type UseAbsenceTableOptions = {
  onEditAbsence?: (absence: IAbsence) => void;
};

export function useAbsenceTable({ onEditAbsence }: UseAbsenceTableOptions = {}) {
  const [filters, setFilters] = useQueryStates(absenceFiltersClient.filter, absenceFiltersClient.option);
  const columns = useMemo(() => createAbsenceTableColumns({ onEditAbsence }), [onEditAbsence]);

  const currentSearchParams: IAbsenceParams = useMemo(() => {
    return {
      employeeId: filters.employeeId || undefined,
      type: (filters.type as AbsenceTypeEnum) || undefined,
      page: filters.page,
      size: filters.size,
      sort: filters.sort || undefined,
      periodeDebut: formatDateParam(filters.periodeDebut),
      periodeFin: formatDateParam(filters.periodeFin),
    };
  }, [filters]);

  const { data: absencesData, isLoading, isFetching, isError } = useAbsencesQuery(currentSearchParams);

  const table = useReactTable({
    data: absencesData?.content || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: absencesData?.totalPages || 0,
  });

  const pagination = {
    pageCount: absencesData?.totalPages || 0,
    totalItems: absencesData?.totalElements || 0,
    page: filters.page,
    handlePageChange: (newPage: number) => {
      setFilters({ page: newPage - 1 });
    },
  };

  const handleSizeChange = (newSize: number) => {
    setFilters({ size: newSize, page: 0 });
  };

  const handleEmployeeFilterChange = (id?: string | null) => {
    setFilters({ employeeId: id || '', page: 0 });
  };

  const handleTypeFilterChange = (type?: string | null) => {
    setFilters({ type: type || '', page: 0 });
  };

  const handlePeriodeFilterChange = (debut?: Date, fin?: Date) => {
    setFilters({
      periodeDebut: debut || subMonths(new Date(), 1),
      periodeFin: fin || new Date(),
      page: 0,
    });
  };

  return {
    absenceTable: table,
    absences: absencesData,
    isAbsenceLoading: isLoading,
    isAbsenceFetching: isFetching,
    isAbsenceError: isError,
    pagination,
    filters,
    setFilters,
    handleSizeChange,
    handleEmployeeFilterChange,
    handleTypeFilterChange,
    handlePeriodeFilterChange,
  };
}


