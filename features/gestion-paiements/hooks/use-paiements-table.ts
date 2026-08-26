import { createElement } from 'react';
import { functionalUpdate, getCoreRowModel, getSortedRowModel, PaginationState, Row, RowSelectionState, useReactTable } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { createPaiementsColumns } from '../columns/paiements.columns';
import PaiementMobileCard from '../components/paiement-mobile-card';
import { useChargesFixesQuery } from '@/features/charges/queries/charges-fixes.query';
import { useChargesVariablesQuery } from '@/features/charges/queries/charges-variables.query';
import { useDecaisserMutation } from '../queries/paiement.mutation';
import { useRapportMasseSalarialeMutation, useSupprimerDepenseDuMoisMutation } from '@/features/charges/queries/charge-fixe.mutation';
import { useSupprimerChargeVariableMutation } from '@/features/charges/queries/charge-variable.mutation';
import { IChargeFixe } from '@/features/charges/types/charge-fixe.type';
import { IChargeVariable } from '@/features/charges/types/charge-variable.type';

export type ChargeTypeFilter = 'fixe' | 'variable';

const DEFAULT_PAGE_SIZE = 10;
const DECAISSE_STATUTS = ['DECAISSE', 'PAID'];

export function usePaiementsTable(debut: string, fin: string, onRequestDecaisser?: (ids: string[]) => void, onRequestDelete?: (id: string) => void, onRequestDeleteFixe?: (id: string) => void, categorieIds?: string[]) {
  const [chargeType, setChargeType] = useState<ChargeTypeFilter>('variable');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const decaisserMutation = useDecaisserMutation(chargeType, fin);
  const supprimerChargeVariableMutation = useSupprimerChargeVariableMutation();
  const supprimerDepenseDuMoisMutation = useSupprimerDepenseDuMoisMutation();
  const { mutate: telechargerRapportMasseSalariale } = useRapportMasseSalarialeMutation();

  const fixesQuery = useChargesFixesQuery({ page: pagination.pageIndex, size: pagination.pageSize, aDecaisser: true, debut, fin, categorieIds }, chargeType === 'fixe');

  const variablesQuery = useChargesVariablesQuery({ page: pagination.pageIndex, size: pagination.pageSize, aDecaisser: true, debut, fin, categorieIds }, chargeType === 'variable');

  const response = chargeType === 'fixe' ? fixesQuery.data : variablesQuery.data;
  const isLoading = chargeType === 'fixe' ? fixesQuery.isLoading : variablesQuery.isLoading;
  const isFetching = chargeType === 'fixe' ? fixesQuery.isFetching : variablesQuery.isFetching;
  // L'ecran bascule entre charges fixes et variables : on suit l'echec et la
  // relance de la query REELLEMENT active, pas des deux.
  const isError = chargeType === 'fixe' ? fixesQuery.isError : variablesQuery.isError;
  const refetch = chargeType === 'fixe' ? fixesQuery.refetch : variablesQuery.refetch;

  const data = useMemo(() => {
    const content = response?.content ?? [];
    if (chargeType === 'variable') {
      return (content as IChargeVariable[]).map((cv) => ({
        ...cv,
        enable: true,
        tauxJournalier: 0,
        montantConsomme: 0,
        dateEcheance: '',
      })) as IChargeFixe[];
    }
    return content as IChargeFixe[];
  }, [response?.content, chargeType]);

  const handleDecaisserOne = useCallback(
    (id: string) => {
      if (onRequestDecaisser) {
        onRequestDecaisser([id]);
      } else {
        decaisserMutation.mutate([id]);
      }
    },
    [decaisserMutation, onRequestDecaisser],
  );

  const handleDeleteOne = useCallback(
    (id: string) => {
      if (onRequestDelete) {
        onRequestDelete(id);
      } else {
        supprimerChargeVariableMutation.mutate(id);
      }
    },
    [supprimerChargeVariableMutation, onRequestDelete],
  );

  const handleDeleteFixeOne = useCallback(
    (id: string) => {
      if (onRequestDeleteFixe) {
        onRequestDeleteFixe(id);
      } else {
        supprimerDepenseDuMoisMutation.mutate({ id, mois: debut });
      }
    },
    [supprimerDepenseDuMoisMutation, onRequestDeleteFixe, debut],
  );

  const columns = useMemo(
    () =>
      createPaiementsColumns({
        onDecaisser: handleDecaisserOne,
        isPending: decaisserMutation.isPending,
        onDelete: chargeType === 'variable' ? handleDeleteOne : undefined,
        isDeleting: supprimerChargeVariableMutation.isPending,
        onDeleteFixe: chargeType === 'fixe' ? handleDeleteFixeOne : undefined,
        isDeletingFixe: supprimerDepenseDuMoisMutation.isPending,
        onRapport: () => {
          telechargerRapportMasseSalariale(debut);
        },
      }),
    [handleDecaisserOne, decaisserMutation.isPending, chargeType, handleDeleteOne, supprimerChargeVariableMutation.isPending, handleDeleteFixeOne, supprimerDepenseDuMoisMutation.isPending, telechargerRapportMasseSalariale, debut],
  );

  // Carte mobile par ligne — réutilise EXACTEMENT les mêmes handlers/états que
  // les colonnes (décaissement, suppression, rapport) → zéro divergence.
  const renderMobileCard = useCallback(
    (row: Row<IChargeFixe>) =>
      createElement(PaiementMobileCard, {
        key: row.id,
        row,
        onDecaisser: handleDecaisserOne,
        isPending: decaisserMutation.isPending,
        onDelete: chargeType === 'variable' ? handleDeleteOne : undefined,
        isDeleting: supprimerChargeVariableMutation.isPending,
        onDeleteFixe: chargeType === 'fixe' ? handleDeleteFixeOne : undefined,
        isDeletingFixe: supprimerDepenseDuMoisMutation.isPending,
        onRapport: () => {
          telechargerRapportMasseSalariale(debut);
        },
      }),
    [handleDecaisserOne, decaisserMutation.isPending, chargeType, handleDeleteOne, supprimerChargeVariableMutation.isPending, handleDeleteFixeOne, supprimerDepenseDuMoisMutation.isPending, telechargerRapportMasseSalariale, debut],
  );

  const table = useReactTable({
    data,
    columns,
    pageCount: response?.totalPages ?? 0,
    manualPagination: true,
    state: { pagination, rowSelection },
    onPaginationChange: (updater) => setPagination(functionalUpdate(updater, pagination)),
    onRowSelectionChange: setRowSelection,
    enableRowSelection: (row) => !DECAISSE_STATUTS.includes(row.original.statut),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const selectedIds = Object.keys(rowSelection).filter((key) => rowSelection[key]);

  const switchChargeType = (type: ChargeTypeFilter) => {
    setChargeType(type);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setRowSelection({});
  };

  return {
    table,
    data,
    renderMobileCard,
    isLoading,
    isFetching,
    isError,
    refetch,
    selectedIds,
    totalElements: response?.totalElements ?? 0,
    pageCount: response?.totalPages ?? 0,
    pagination,
    chargeType,
    switchChargeType,
    decaisserMutation,
    supprimerChargeVariableMutation,
    supprimerDepenseDuMoisMutation,
  };
}

