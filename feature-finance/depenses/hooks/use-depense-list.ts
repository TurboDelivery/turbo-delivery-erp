// hooks/useDepenseList.ts
import { useState, useMemo, useCallback } from "react";
import {
    SortingState,
    VisibilityState,
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    ColumnDef,
    ColumnFiltersState,
} from "@tanstack/react-table";
import { useQueryStates } from 'nuqs';
import { depenseFiltersClient } from '../filters/depense.filter';
import { useDepensesListQuery } from "../queries/depense-list.query";
import { IDepense, IDepensesParams } from "../types/depense.type";
import { useGlobalFilterListener } from "@/hooks/use-global-filter-listener";

export interface IDepenseListTableProps {
    columns: ColumnDef<IDepense>[];
    initialData?: IDepense[];
}

export function useDepenseList({ columns, initialData = [] }: IDepenseListTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    // Gestion des paramètres d'URL via Nuqs
    const [filters, setFilters] = useQueryStates(depenseFiltersClient.filter, depenseFiltersClient.option);

    // Écouter les filtres globaux de la navbar
    useGlobalFilterListener({
        moduleName: 'depense',
        onFilterChange: (globalFilters) => {
            // Appliquer les filtres globaux aux filtres locaux
            setFilters(prev => ({
                ...prev,
                ...globalFilters,
                page: 1, // Reset à la première page quand on filtre
            }));
        },
        onFilterClear: () => {
            // Réinitialiser tous les filtres
            setFilters(prev => ({
                ...prev,
                description: '',
                restaurantId: '',
                dateDepense: '',
                montant: 0,
                categorie: '',
                statut: '',
                page: 1,
            }));
        }
    });

    // Construction des paramètres de recherche
    const currentSearchParams: IDepensesParams = useMemo(() => {
        return {
            page: filters.page,
            limit: filters.limit,
            categorie: filters.categorie,
            description: filters.description,
            montant: filters.montant,
            dateDepense: filters.dateDepense,
        };
    }, [filters]);

    // Récupération des données filtrées
    const { data, isLoading, isError, error, isFetching } = useDepensesListQuery(currentSearchParams);

    const depenses = data || initialData;

    // Appliquer les filtres localement pour le tableau
    const filteredData = useMemo(() => {
        if (!filters.categorie && !filters.description && !filters.montant && !filters.dateDepense) {
            return depenses;
        }

        return depenses.filter(depense => {
            // Filtre par catégorie
            if (filters.categorie && filters.categorie !== "all" && depense.categorie.id !== filters.categorie) {
                return false;
            }

            // Filtre par description
            if (filters.description && 
                !depense.libelle.toLowerCase().includes(filters.description.toLowerCase())) {
                return false;
            }


            // Filtre par date
            if (filters.dateDepense) {
                const depenseDate = new Date(depense.dateDepense).toISOString().split('T')[0];
                if (depenseDate !== filters.dateDepense) {
                    return false;
                }
            }

            return true;
        });
    }, [depenses, filters]);

    // Configuration de TanStack Table
    const table = useReactTable({
        data: filteredData, // Utiliser les données filtrées
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        manualPagination: true,
        pageCount: Math.ceil(filteredData.length / (filters.limit || 10)),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex: (filters.page || 1) - 1,
                pageSize: filters.limit || 10,
            },
        },
        onPaginationChange: (updater) => {
            const newState = typeof updater === 'function' ? updater(table.getState().pagination) : updater;
            setFilters(prev => ({
                ...prev,
                page: newState.pageIndex + 1,
                limit: newState.pageSize,
            }));
        },
    });

    return {
        table,
        isLoading: isLoading || isFetching,
        isError,
        error,
        filters,
        handleEnumFilterChange: useCallback((filterName: string, value: string) => {
            setFilters(prev => ({
                ...prev,
                [filterName]: value,
                page: 1,
            }));
        }, [setFilters]),
        handleTextFilterChange: useCallback((filterName: string, value: string) => {
            setFilters(prev => ({
                ...prev,
                [filterName]: value,
                page: 1,
            }));
        }, [setFilters]),
    };
}