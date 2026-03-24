import {useCallback, useMemo, useState} from "react";
import {getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {useQueryStates} from 'nuqs';
import {utilisateurFiltersClient} from '../filters/utilisateur.filters';
import {useUtilisateursListQuery} from "../queries/utilisateur.query";
import {IUtilisateur, IUtilisateursParams} from "../types/utilisateur.type";
import {utilisateurTableColumns} from "@/components/(protected)/admin/privileges/utilisateur/table/columns";

export function useUtilisateurListTable() {
	// Gestion des paramètres d'URL via Nuqs
	const [filters, setFilters] = useQueryStates(utilisateurFiltersClient.filter, utilisateurFiltersClient.option);

	// Construction des paramètres de recherche
	const currentSearchParams: IUtilisateursParams = useMemo(() => {
		return {
			userType: 'internal',
			page: filters.page,
			limit: filters.limit,
		};
	}, [filters]);

	// Récupération des données avec options React Query optimisées
	const {data, isLoading, isError, isFetching} = useUtilisateursListQuery(currentSearchParams);

	const users = data?.data || [];

	// États et gestionnaires pour les modales
	const [addOpen, setAddOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [lockUnlockOpen, setLockUnlockOpen] = useState(false);
	const [currentUser, setCurrentUser] = useState<IUtilisateur | null>(null);

	const handleEditUser = useCallback((user: IUtilisateur) => {
		setCurrentUser(user);
		setEditOpen(true);
	}, []);

	const handleDeleteUser = useCallback((user: IUtilisateur) => {
		setCurrentUser(user);
		setDeleteOpen(true);
	}, []);

	/**
	 * Gère les changements pour les champs de filtre textuels
	 * Nuqs throttle automatiquement les mises à jour URL/serveur
	 */
	const handleTextFilterChange = useCallback((
		filterName: 'firstName' | 'lastName' | 'email' | 'phoneNumber',
		value: string
	) => {
		setFilters(prev => ({
			...prev,
			[filterName]: value,
			page: 1, // Réinitialise à la première page
		}));
	}, [setFilters]);

	/**
	 * Gère les changements pour les champs de filtre d'enum
	 * Pas de throttling nécessaire pour ces filtres (changements moins fréquents)
	 */
	const handleEnumFilterChange = useCallback((
		filterName: 'status' | 'role',
		value: string
	) => {
		setFilters(prev => ({
			...prev,
			[filterName]: value,
			page: 1,
		}));
	}, [setFilters]);

	// Configuration de TanStack Table
	const table = useReactTable({
		data: users,
		columns: utilisateurTableColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		meta: {
			onEdit: handleEditUser,
			onDelete: handleDeleteUser,
		},
	});

	return {
		table,
		isLoading,
		isError,
		isFetching,
		handleTextFilterChange,
		handleEnumFilterChange,
		modalStates: {
			addOpen,
			lockUnlockOpen,
			editOpen,
			deleteOpen,
		},
		modalHandlers: {
			setAddOpen,
			setLockUnlockOpen,
			setEditOpen,
			setDeleteOpen,
		},
		pagination: {
			page: data?.page || 1,
			limit: data?.limit || 10,
			total: data?.total || 0,
			totalPages: data?.totalPages || 0,
			handlePageChange: (page: number) => {
				setFilters(prev => ({
					...prev,
					page,
				}));
			}
		},
		currentUser,
		filters,
	};
}