import { functionalUpdate, getCoreRowModel, getSortedRowModel, PaginationState, useReactTable } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { createChargesFixesDetailsColumns } from '../columns/charges-fixes-details.columns';
import { createDepensesVariablesDetailsColumns } from '../columns/depenses-variables-details.columns';
import { IChargeFixe } from '../types/charge-fixe.type';
import { IChargeVariable } from '../types/charge-variable.type';
import { useChargesFixesQuery } from '../queries/charges-fixes.query';
import { useChargesVariablesQuery } from '../queries/charges-variables.query';

const DEFAULT_PAGE_SIZE = 8;

type Options = {
  onToggleChargeFixe?: (charge: IChargeFixe, enabled: boolean) => void;
  onEditVariable?: (charge: IChargeVariable) => void;
  onApproveVariable?: (charge: IChargeVariable) => void;
  onRejectVariable?: (charge: IChargeVariable) => void;
  onViewJustificatif?: (url: string) => void;
};

export function useChargesDetailsTable({
  onToggleChargeFixe,
  onEditVariable,
  onApproveVariable,
  onRejectVariable,
  onViewJustificatif,
}: Options = {}) {
  const [fixesPagination, setFixesPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [variablesPagination, setVariablesPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const { data: fixesResponse, isLoading: isFixesLoading, isFetching: isFixesFetching } = useChargesFixesQuery({
    page: fixesPagination.pageIndex,
    size: fixesPagination.pageSize,
  });

  const { data: variablesResponse, isLoading: isVariablesLoading, isFetching: isVariablesFetching } = useChargesVariablesQuery({
    page: variablesPagination.pageIndex,
    size: variablesPagination.pageSize,
  });

  const fixesData = useMemo(() => fixesResponse?.content ?? [], [fixesResponse?.content]);
  const variablesData = useMemo(() => variablesResponse?.content ?? [], [variablesResponse?.content]);

  const fixesColumns = useMemo(
    () => createChargesFixesDetailsColumns({ onToggle: onToggleChargeFixe }),
    [onToggleChargeFixe],
  );
  const variablesColumns = useMemo(
    () => createDepensesVariablesDetailsColumns({
      onEdit: onEditVariable,
      onApprove: onApproveVariable,
      onReject: onRejectVariable,
      onViewJustificatif,
    }),
    [onEditVariable, onApproveVariable, onRejectVariable, onViewJustificatif],
  );

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

  return {
    fixesTable,
    variablesTable,
    isFixesLoading,
    isFixesFetching,
    isVariablesLoading,
    isVariablesFetching,
    fixesTotalElements: fixesResponse?.totalElements ?? 0,
    fixesPageCount: fixesResponse?.totalPages ?? 0,
    variablesTotalElements: variablesResponse?.totalElements ?? 0,
    variablesPageCount: variablesResponse?.totalPages ?? 0,
    fixesPagination,
    variablesPagination,
  };
}
