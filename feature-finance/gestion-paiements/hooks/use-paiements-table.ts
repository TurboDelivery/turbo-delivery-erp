import { functionalUpdate, getCoreRowModel, getSortedRowModel, PaginationState, useReactTable } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { createPaiementsColumns } from '../columns/paiements.columns';
import { usePaiementsQuery } from '../queries/paiements.query';

const DEFAULT_PAGE_SIZE = 10;

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTH_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function usePaiementsTable() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth()); // 0-based
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const moisKey = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
  const monthLabel = `${MONTH_FULL[selectedMonthIndex]} ${selectedYear}`;

  const { data: response, isLoading, isFetching } = usePaiementsQuery({
    page: pagination.pageIndex,
    size: pagination.pageSize,
    mois: moisKey,
  });

  const data = useMemo(() => response?.content ?? [], [response?.content]);

  const onToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(data.map((p) => p.id)));
  }, [data]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const columns = useMemo(
    () => createPaiementsColumns({ selectedIds, onToggleSelect }),
    [selectedIds, onToggleSelect],
  );

  const table = useReactTable({
    data,
    columns,
    pageCount: response?.totalPages ?? 0,
    manualPagination: true,
    state: { pagination },
    onPaginationChange: (updater) => setPagination(functionalUpdate(updater, pagination)),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const goToPreviousMonth = () => {
    if (selectedMonthIndex === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonthIndex(11);
    } else {
      setSelectedMonthIndex((m) => m - 1);
    }
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setSelectedIds(new Set());
  };

  const goToNextMonth = () => {
    if (selectedMonthIndex === 11) {
      setSelectedYear((y) => y + 1);
      setSelectedMonthIndex(0);
    } else {
      setSelectedMonthIndex((m) => m + 1);
    }
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setSelectedIds(new Set());
  };

  const selectMonth = (index: number) => {
    setSelectedMonthIndex(index);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setSelectedIds(new Set());
  };

  return {
    table,
    data,
    isLoading,
    isFetching,
    moisKey,
    monthLabel,
    selectedYear,
    selectedMonthIndex,
    monthNames: MONTH_NAMES,
    goToPreviousMonth,
    goToNextMonth,
    selectMonth,
    selectedIds,
    selectAll,
    deselectAll,
    totalElements: response?.totalElements ?? 0,
    pageCount: response?.totalPages ?? 0,
    pagination,
  };
}
