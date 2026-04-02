import { functionalUpdate, getCoreRowModel, getSortedRowModel, PaginationState, Table, useReactTable } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { createChargesFixesColumns } from '../columns/charges-fixes.columns';
import { IChargeFixe } from '../types/charge-fixe.type';
import { useChargesFixesQuery } from '../queries/charges-fixes.query';

const DEFAULT_PAGE_SIZE = 10;

type UseChargesFixesTableOptions = {
  onEdit?: (charge: IChargeFixe) => void;
  onDelete?: (charge: IChargeFixe) => void;
};

export type UseChargesFixesTableResult = {
  table: Table<IChargeFixe>;
  data: IChargeFixe[];
  pagination: PaginationState;
  setPagination: (pagination: PaginationState) => void;
  pageCount: number;
  totalElements: number;
  isLoading: boolean;
  isFetching: boolean;
  stats: {
    totalMontant: number;
    totalTauxJournalier: number;
    activeCount: number;
  };
};

export function useChargesFixesTable({ onEdit, onDelete }: UseChargesFixesTableOptions = {}): UseChargesFixesTableResult {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const columns = useMemo(() => createChargesFixesColumns({ onEdit, onDelete }), [onDelete, onEdit]);

  const {
    data: chargesFixesResponse,
    isLoading,
    isFetching,
  } = useChargesFixesQuery({
    page: pagination.pageIndex,
    size: pagination.pageSize,
  });

  console.log('Charges fixes response:', chargesFixesResponse);

  const data = useMemo(() => chargesFixesResponse?.content ?? [], [chargesFixesResponse?.content]);
  const pageCount = chargesFixesResponse?.totalPages ?? 0;
  const totalElements = chargesFixesResponse?.totalElements ?? 0;

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    state: { pagination },
    onPaginationChange: (updater) => {
      const next = functionalUpdate(updater, pagination);
      setPagination(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const stats = useMemo(() => {
    const totalMontant = data.reduce((sum, item) => sum + item.montant, 0);
    const totalTauxJournalier = Math.round(totalMontant / 30);

    return {
      totalMontant,
      totalTauxJournalier,
      activeCount: totalElements,
    };
  }, [data, totalElements]);

  return {
    table,
    data,
    pagination,
    setPagination,
    pageCount,
    totalElements,
    isLoading,
    isFetching,
    stats,
  };
}
