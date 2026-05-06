import { functionalUpdate, getCoreRowModel, getSortedRowModel, PaginationState, useReactTable } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import { chargesDepensesFiltersClient } from '../filters/charges-depenses.filter';
import { createChargesFixesV2Columns } from '../columns/charges-fixes-v2.columns';
import { createDepensesVariablesV2Columns } from '../columns/depenses-variables-v2.columns';
import { useChargesFixesQuery, useChargesFixesStatsQuery } from '../queries/charges-fixes.query';
import { useChargesVariablesQuery } from '../queries/charges-variables.query';
import { IChargeFixe } from '../types/charge-fixe.type';
import { IChargeVariable } from '../types/charge-variable.type';

const DEFAULT_PAGE_SIZE = 5;

type UseChargesDepensesV2Options = {
  onEditChargeFixe?: (charge: IChargeFixe) => void;
  onDeleteChargeFixe?: (charge: IChargeFixe) => void;
  onToggleChargeFixe?: (charge: IChargeFixe, enabled: boolean) => void;
  onEditChargeVariable?: (charge: IChargeVariable) => void;
  onApproveChargeVariable?: (charge: IChargeVariable) => void;
  onRejectChargeVariable?: (charge: IChargeVariable) => void;
  onViewJustificatif?: (url: string) => void;
  categorieIds?: string[];
};

export function useChargesDepensesV2({
  onEditChargeFixe,
  onDeleteChargeFixe,
  onToggleChargeFixe,
  onEditChargeVariable,
  onApproveChargeVariable,
  onRejectChargeVariable,
  onViewJustificatif,
  categorieIds,
}: UseChargesDepensesV2Options = {}) {
  const [filters, setFilters] = useQueryStates(
    chargesDepensesFiltersClient.filter,
    chargesDepensesFiltersClient.option,
  );

  const [fixesPagination, setFixesPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [variablesPagination, setVariablesPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const statsParams = useMemo(() => {
    const p: { debut?: string; fin?: string } = {};
    if (filters.debut) p.debut = filters.debut;
    if (filters.fin) p.fin = filters.fin;
    return p;
  }, [filters.debut, filters.fin]);

  // Queries
  const { data: fixesResponse, isLoading: isFixesLoading, isFetching: isFixesFetching } = useChargesFixesQuery({
    page: fixesPagination.pageIndex,
    size: fixesPagination.pageSize,
    debut: filters.debut || undefined,
    fin: filters.fin || undefined,
    categorieIds: categorieIds && categorieIds.length > 0 ? categorieIds : undefined,
  });

  const { data: variablesResponse, isLoading: isVariablesLoading, isFetching: isVariablesFetching } = useChargesVariablesQuery({
    page: variablesPagination.pageIndex,
    size: variablesPagination.pageSize,
    debut: filters.debut || undefined,
    fin: filters.fin || undefined,
    categorieIds: categorieIds && categorieIds.length > 0 ? categorieIds : undefined,
  });

  const { data: stats, isLoading: isStatsLoading } = useChargesFixesStatsQuery(statsParams);

  // Data
  const fixesData = useMemo(() => fixesResponse?.content ?? [], [fixesResponse?.content]);
  const variablesData = useMemo(() => variablesResponse?.content ?? [], [variablesResponse?.content]);

  // Columns
  const fixesColumns = useMemo(
    () => createChargesFixesV2Columns({ onEdit: onEditChargeFixe, onDelete: onDeleteChargeFixe, onToggle: onToggleChargeFixe }),
    [onEditChargeFixe, onDeleteChargeFixe, onToggleChargeFixe],
  );
  const variablesColumns = useMemo(
    () => createDepensesVariablesV2Columns({
      onEdit: onEditChargeVariable,
      onApprove: onApproveChargeVariable,
      onReject: onRejectChargeVariable,
      onViewJustificatif,
    }),
    [onEditChargeVariable, onApproveChargeVariable, onRejectChargeVariable, onViewJustificatif],
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
    isStatsLoading,
    fixesRemainingCount,
    variablesRemainingCount,
    stats,
    filters,
    setFilters,
  };
}
