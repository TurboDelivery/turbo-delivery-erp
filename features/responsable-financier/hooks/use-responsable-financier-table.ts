'use client';

import { useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { ColumnDef, getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { responsableFinancierFilters } from '../filters/responsable-financier.filter';
import { useFacturesRFQuery } from '../queries/responsable-financier.query';
import { IFactureRF, IFactureRFParams } from '../types/responsable-financier.types';

export const useResponsableFinancierTable = (columns: ColumnDef<IFactureRF>[]) => {
  const [filters, setFilters] = useQueryStates(
    responsableFinancierFilters.filter,
    responsableFinancierFilters.option,
  );

  const params: IFactureRFParams = useMemo(() => ({
    periode: 'plage',
    dateDebut: filters.dateDebut ? filters.dateDebut.toISOString().split('T')[0] : undefined,
    dateFin: filters.dateFin ? filters.dateFin.toISOString().split('T')[0] : undefined,
    statut: filters.statut || undefined,
    // 'TOUT' = pas de filtre côté backend, on omet le paramètre.
    cycle: filters.cycle && filters.cycle !== 'TOUT' ? filters.cycle : undefined,
    restaurantId: filters.restaurantId || undefined,
    page: filters.page,
    size: filters.size,
  }), [filters]);

  const { data, isLoading, isFetching, isError } = useFacturesRFQuery(params);

  const sorting: SortingState = [];

  const table = useReactTable({
    data: data?.factures?.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting },
    manualPagination: true,
    pageCount: data?.factures?.totalPages ?? -1,
  });

  return {
    table,
    filters,
    setFilters,
    isLoading,
    isFetching,
    isError,
    stats: data?.stats,
    totalElements: data?.factures?.totalElements ?? 0,
    totalPages: data?.factures?.totalPages ?? 0,
  };
};

export default useResponsableFinancierTable;
