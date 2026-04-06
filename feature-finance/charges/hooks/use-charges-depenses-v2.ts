import { functionalUpdate, getCoreRowModel, getSortedRowModel, PaginationState, useReactTable } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { createChargesFixesV2Columns } from '../columns/charges-fixes-v2.columns';
import { createDepensesVariablesV2Columns } from '../columns/depenses-variables-v2.columns';
import { useChargesFixesQuery, useChargesFixesStatsQuery } from '../queries/charges-fixes.query';
import { useDepensesListQuery } from '@/feature-finance/depenses/queries/depense-list.query';
import { IDepense } from '@/features/depenses/types/depense.type';

const DEFAULT_PAGE_SIZE = 5;

type UseChargesDepensesV2Options = {
  onEditDepense?: (depense: IDepense) => void;
  onApproveDepense?: (depense: IDepense) => void;
  onRejectDepense?: (depense: IDepense) => void;
  onViewJustificatif?: (depense: IDepense) => void;
};

export function useChargesDepensesV2({
  onEditDepense,
  onApproveDepense,
  onRejectDepense,
  onViewJustificatif,
}: UseChargesDepensesV2Options = {}) {
  const [fixesPagination, setFixesPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [variablesPagination, setVariablesPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  // Queries
  const { data: fixesResponse, isLoading: isFixesLoading, isFetching: isFixesFetching } = useChargesFixesQuery({
    page: fixesPagination.pageIndex,
    size: fixesPagination.pageSize,
  });

  const { data: variablesResponse, isLoading: isVariablesLoading, isFetching: isVariablesFetching } = useDepensesListQuery({
    page: variablesPagination.pageIndex,
    limit: variablesPagination.pageSize,
  });

  const { data: stats } = useChargesFixesStatsQuery();

  // Data
  const fixesData = useMemo(() => fixesResponse?.content ?? [], [fixesResponse?.content]);
  const variablesData = useMemo(() => variablesResponse?.content ?? [], [variablesResponse?.content]);

  // Columns
  const fixesColumns = useMemo(() => createChargesFixesV2Columns(), []);
  const variablesColumns = useMemo(
    () => createDepensesVariablesV2Columns({
      onEdit: onEditDepense,
      onApprove: onApproveDepense,
      onReject: onRejectDepense,
      onViewJustificatif,
    }),
    [onEditDepense, onApproveDepense, onRejectDepense, onViewJustificatif],
  );

  // Tables
  const fixesTable = useReactTable({
    data: fixesData,
    columns: fixesColumns,
    pageCount: fixesResponse?.totalPages ?? 0,
    manualPagination: true,
    state: { pagination: fixesPagination },
    onPaginationChange: (updater) => setFixesPagination(functionalUpdate(updater, fixesPagination)),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const variablesTable = useReactTable({
    data: variablesData,
    columns: variablesColumns,
    pageCount: variablesResponse?.totalPages ?? 0,
    manualPagination: true,
    state: { pagination: variablesPagination },
    onPaginationChange: (updater) => setVariablesPagination(functionalUpdate(updater, variablesPagination)),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Computed stats
  const totalChargesFixes = stats?.totalMensuel ?? 0;
  const today = new Date();
  const jourDuMois = today.getDate();
  const joursTotal = 30;
  const prorata = Math.round((totalChargesFixes / joursTotal) * jourDuMois);
  const pourcentageMois = Math.round((jourDuMois / joursTotal) * 100);

  const depensesApprouvees = variablesData.filter(
    (v) => v.statut === 'APPROUVE' || v.statut === 'PAID',
  );
  const totalVariablesApprouvees = depensesApprouvees.reduce((sum, v) => sum + v.montant, 0);
  const countVariablesApprouvees = depensesApprouvees.length;

  const totalChargesADate = prorata + totalVariablesApprouvees;
  const pointMortCourses = stats?.pointMortQuotidien ?? 0;

  const fixesTotalElements = fixesResponse?.totalElements ?? 0;
  const fixesRemainingCount = Math.max(0, fixesTotalElements - fixesPagination.pageSize);
  const variablesTotalElements = variablesResponse?.totalElements ?? 0;
  const variablesRemainingCount = Math.max(0, variablesTotalElements - variablesPagination.pageSize);

  return {
    fixesTable,
    variablesTable,
    isFixesLoading,
    isFixesFetching,
    isVariablesLoading,
    isVariablesFetching,
    fixesRemainingCount,
    variablesRemainingCount,
    cardStats: {
      totalChargesFixes,
      prorata,
      jourDuMois,
      joursTotal,
      pourcentageMois,
      totalVariablesApprouvees,
      countVariablesApprouvees,
      totalChargesADate,
      pointMortCourses,
    },
  };
}
