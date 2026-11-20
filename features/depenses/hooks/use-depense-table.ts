import { useDepensesListQuery } from '@/features/depenses/queries/depense-list.query';
import { type GenericTableFilters } from '@/hooks/use-generic-table';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';
import React, { useMemo, useState } from 'react';
import { getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';

export interface DepenseFilters extends GenericTableFilters {
  debut?: Date;
  fin?: Date;
  categoriesDepense?: string[] | null;
  typeDepense?: 'FIXE' | 'VARIABLE';
  statut?: string;
}

/**
 * UN MAGASIN DE FILTRES FOURNI PAR L'APPELANT.
 *
 * <p>Le hook acceptait déjà un `externalFilters`, mais la fonctionnalité était à moitié
 * faite : la LECTURE le respectait et TOUTES les écritures repartaient vers le `useState`
 * local. `handlePageChange` ne faisait carrément rien quand on en fournissait un
 * (`if (!externalFilters)`), et `pageSize` lisait le magasin local même en mode externe.
 * Conséquence : l'écran `/finance/depense` portait DEUX jeux de filtres d'apparence
 * identique, la barre du haut dans l'URL et celle du tableau en mémoire, qui ne
 * s'accordaient jamais. Les cartes et la liste pouvaient afficher deux périodes
 * différentes sans que rien ne le dise.</p>
 *
 * <p>D'où ce contrat : qui fournit un magasin fournit AUSSI son écriture. Il n'existe
 * alors qu'un seul endroit où la vérité est écrite.</p>
 *
 * <p>Sans magasin, le hook garde son `useState` : c'est ce dont `/finance/sorties`
 * (`depenses-client.tsx`) a besoin, avec sa période « Toutes les dates » qui n'a pas
 * d'équivalent dans l'URL.</p>
 */
export interface MagasinFiltresDepense {
  filters: DepenseFilters;
  appliquer: (maj: (prev: DepenseFilters) => DepenseFilters) => void;
}

/**
 * ⚠ DEUX VOCABULAIRES, ET IL FAUT TRADUIRE.
 *
 * <p>TanStack envoie l'IDENTIFIANT DE COLONNE (`date_depense`, `montant`), que l'URL
 * conserve puisqu'il décrit ce que l'opérateur a cliqué. Le serveur, lui, attend un nom
 * de PROPRIÉTÉ de l'entité, parce que le listage passe par des requêtes dérivées et que
 * `Sort.by(...)` est interprété comme tel. Sa liste blanche
 * (`DepenseResource.TRIS_ACCEPTES`) n'accepte donc que `dateDepense`, `createdAt`,
 * `montant` et `description`.</p>
 *
 * <p>Une colonne absente de cette table n'est pas envoyée : le serveur retombe alors sur
 * son tri par défaut plutôt que de recevoir un nom qu'il ne connaît pas.</p>
 */
const TRI_API: Record<string, string> = {
  date_ajout: 'createdAt',
  date_depense: 'dateDepense',
  description: 'description',
  montant: 'montant',
};

const initialFilters: DepenseFilters = {
  categoriesDepense: null,
  limit: 20,
  page: 0,
  orderBy: undefined,
  orderDirection: 'desc',
};

export const useDepenseTable = (externe?: MagasinFiltresDepense) => {
  const [filtresLocaux, setFiltresLocaux] = useState<DepenseFilters>({
    ...initialFilters,
    debut: startOfMonth(new Date()),
    fin: new Date(),
  });

  const currentFilters = externe?.filters ?? filtresLocaux;

  /**
   * L'UNIQUE chemin d'écriture, stable d'un rendu à l'autre.
   *
   * <p>La référence est relue à chaque appel : l'appelant recrée son objet de magasin à
   * chaque rendu, et mettre `externe` dans les dépendances d'un `useCallback` rendrait
   * `appliquer` instable, ce qui invaliderait les `useMemo` qui en dépendent à chaque
   * rendu.</p>
   */
  const externeRef = React.useRef(externe);
  externeRef.current = externe;
  const appliquer = React.useCallback((maj: (prev: DepenseFilters) => DepenseFilters) => {
    const magasin = externeRef.current;
    if (magasin) {
      magasin.appliquer(maj);
      return;
    }
    setFiltresLocaux(maj);
  }, []);

  const [sorting, setSorting] = React.useState<SortingState>(() => {
    const orderBy = currentFilters?.orderBy;
    const orderDirection = currentFilters?.orderDirection ?? 'desc';
    return orderBy ? [{ id: orderBy, desc: orderDirection === 'desc' }] : [];
  });

  React.useEffect(() => {
    const orderBy = currentFilters?.orderBy;
    const orderDirection = currentFilters?.orderDirection ?? 'desc';
    const next = orderBy ? [{ id: orderBy, desc: orderDirection === 'desc' }] : [];
    setSorting((prev) => {
      const prevFirst = prev[0];
      const nextFirst = next[0];
      if (prevFirst?.id === nextFirst?.id && prevFirst?.desc === nextFirst?.desc) return prev;
      return next;
    });
  }, [currentFilters?.orderBy, currentFilters?.orderDirection]);

  const currentSearchParams = useMemo(() => {
    return {
      page: currentFilters?.page ?? 0,
      limit: currentFilters?.limit ?? 20,
      debut: currentFilters.debut,
      fin: currentFilters.fin,
      // Envoyer les filtres de catégories au backend
      categoriesDepense: currentFilters.categoriesDepense || undefined,
      typeDepense: currentFilters.typeDepense,
      // Chaine vide = tous les statuts : ne rien envoyer plutot qu'un filtre vide.
      statut: currentFilters.statut || undefined,
      orderBy: currentFilters.orderBy ? TRI_API[currentFilters.orderBy] : undefined,
      orderDirection: currentFilters.orderDirection as 'asc' | 'desc' | undefined,
    };
  }, [currentFilters?.page, currentFilters?.limit, currentFilters.debut, currentFilters.fin, currentFilters.categoriesDepense, currentFilters.typeDepense, currentFilters.statut, currentFilters.orderBy, currentFilters.orderDirection]);

  const setTypeDepense = (typeDepense?: 'FIXE' | 'VARIABLE') => {
    appliquer((prev) => ({
      ...prev,
      typeDepense,
      page: 0,
    }));
  };

  const { data: allDepensesData, isLoading: allDepensesLoading, error, isError, isFetching, refetch } = useDepensesListQuery(currentSearchParams);
  const allDepenses = allDepensesData?.content || [];

  // Utiliser toujours la pagination API (pas de pagination locale)
  const pagination = useMemo(() => {
    return {
      pageCount: allDepensesData?.totalPages || 0,
      totalItems: allDepensesData?.totalElements || 0,
      page: currentFilters?.page ?? 0,
      handlePageChange: (page: number) => {
        appliquer((prev) => ({
          ...prev,
          page: page - 1,
        }));
      },
    };
  }, [allDepensesData, currentFilters?.page, appliquer]);

  const isLoading = allDepensesLoading;

  const setSelectedCategories = (categoryIds: string[] | null) => {
    appliquer((prev) => ({
      ...prev,
      categoriesDepense: categoryIds,
      page: 0, // Reset to first page when filters change
    }));
  };

  const handleDateChange = (value: DateRange | undefined) => {
    if (value?.from && value?.to) {
      appliquer((prev) => ({
        ...prev,
        debut: value.from,
        fin: value.to,
        page: 0,
      }));
    }
  };

  const table = useReactTable({
    columns: depenseColumns,
    data: allDepenses,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    state: {
      pagination: {
        pageIndex: pagination.page,
        pageSize: currentFilters?.limit ?? 20,
      },
      sorting,
    },
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const first = next[0];
        appliquer((prevFilters) => ({
          ...prevFilters,
          orderBy: first?.id ?? undefined,
          orderDirection: first ? (first.desc ? 'desc' : 'asc') : undefined,
          page: 0,
        }));
        return next;
      });
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' ? updater(table.getState().pagination) : updater;
      appliquer((prev) => ({
        ...prev,
        page: newState.pageIndex,
        limit: newState.pageSize,
      }));
    },
  });

  return {
    table,
    isLoading,
    isError,
    isFetching,
    refetch,
    setFilters: appliquer,
    depenses: allDepenses,
    depensesData: allDepensesData,
    error,
    filters: currentFilters,
    setSelectedCategories,
    setTypeDepense,
    pagination,
    handleDateChange,
  };
};
