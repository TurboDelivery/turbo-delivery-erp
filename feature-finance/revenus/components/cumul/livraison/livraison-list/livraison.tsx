"use client"
import React, { useState, useMemo } from "react"
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import FilterPeriode from "@/feature-finance/revenus/components/filtres/periode/filter-periode"
import { RevenusFilters } from "@/feature-finance/revenus/components/filtres/revenus"
import { LivraisonDetailModal } from "./livraison-detail-modal"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useLivraisonList } from "@/feature-finance/revenus/hooks/use-livraison-list"
import { Pagination } from "./pagination"

export default function LivraisonList() {
    // S'assurer que livraisons est toujours un tableau
    const {livraisons, isLoading, isError, error, filters} = useLivraisonList()

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])
    
    // S'assurer que livraisons est un tableau avant de faire les calculs
    const livraisonsArray = Array.isArray(livraisons) ? livraisons : []

    // Gestionnaire pour le changement de restaurants
    const handleRestaurantChange = (restaurantIds: string[]) => {
        setSelectedRestaurants(restaurantIds)
        setCurrentPage(1) // Reset à la première page quand on filtre
    }

    // Gestionnaire pour effacer tous les filtres
    const handleClearFilters = () => {
        setSelectedRestaurants([])
        setCurrentPage(1)
    }

    // Filtrage basé sur les filtres du hook
    const filteredLivraisons = useMemo(() => {
        if (!livraisonsArray.length) return []
        
        return livraisonsArray.filter((livraisonItem) => {
            // Filtre par restaurants (multi-sélection)
            if (selectedRestaurants.length > 0 && livraisonItem.nomRestaurant) {
                if (!selectedRestaurants.includes(livraisonItem.nomRestaurant)) return false
            }
            
            // Filtre par nom de livreur
            if (filters.nomLivreur && livraisonItem.nomLivreur && !livraisonItem.nomLivreur.toLowerCase().includes(filters.nomLivreur.toLowerCase())) return false
            
            // Filtre par date exacte (création)
            if (filters.createdAt && livraisonItem.createdAt && !livraisonItem.createdAt.includes(filters.createdAt)) return false
            
            // Filtre par frais de livraison
            if (filters.fraisLivraison && livraisonItem.fraisLivraison !== filters.fraisLivraison) return false
            
            // Filtre par date de début
            if (filters.dateLivraison && livraisonItem.createdAt) {
                const livraisonDate = new Date(livraisonItem.createdAt)
                const dateLivraison = new Date(filters.dateLivraison)
                if (livraisonDate < dateLivraison) return false
            }
            
            return true
        })
    }, [livraisonsArray, filters, selectedRestaurants])
    
    // Recalculer la pagination avec les données filtrées
    const filteredTotalPages = Math.ceil(filteredLivraisons.length / itemsPerPage)
    const filteredStartIndex = (currentPage - 1) * itemsPerPage
    const filteredCurrentLivraisons = filteredLivraisons.slice(filteredStartIndex, filteredStartIndex + itemsPerPage)

    const formatDate = (dateString: string) => {
        if (!dateString) return "";

        try {
            const date = parseISO(dateString);
            return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
        } catch (error) {
            console.warn("Erreur de formatage de date:", error);
            return dateString;
        }
    };

    // Définition des colonnes pour TanStack Table
    const columns = useMemo(() => [
        {
            accessorKey: 'refCommande',
            header: 'Reference',
            cell: (info: any) => (
                <div className="font-medium text-center">
                    {info.getValue()}
                </div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Date et heure',
            cell: (info: any) => (
                <div className="font-medium text-center">
                    {formatDate(info.getValue())}
                </div>
            ),
        },
        {
            accessorKey: 'nomLivreur',
            header: 'Livreur',
            cell: (info: any) => (
                <div className="font-medium text-center">
                    {info.getValue()}
                </div>
            ),
        },
        {
            accessorKey: 'totalAmount',
            header: 'Coût commande',
            cell: (info: any) => (
                <div className="font-medium text-center">
                    {info.getValue()}
                </div>
            ),
        },
        {
            accessorKey: 'fraisLivraison',
            header: 'Commission(%)',
            cell: (info: any) => (
                <div className="font-medium text-center">
                    {info.getValue()} XOF
                </div>
            ),
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            cell: (info: any) => {
                const livraison = info.row.original
                return (
                    <div className="text-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-red-400 hover:bg-red-600 cursor-pointer">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <LivraisonDetailModal livraison={livraison} />
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ], [])

    const table = useReactTable({
        data: filteredCurrentLivraisons,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <p>Chargement des livraisons...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex justify-center items-center p-8">
                <p className="text-red-500">Erreur lors du chargement des livraisons</p>
            </div>
        );
    }

    return (
        <div className="">
            <Card className="shadow-lg border-0">
                <CardHeader className="">
                    <CardTitle>
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-sm md:text-2xl">Liste des livraisons</p>
                            <RevenusFilters
                                onRestaurantChange={handleRestaurantChange}
                                selectedRestaurants={selectedRestaurants}
                                onClearFilters={handleClearFilters}
                            />
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Version Desktop */}
                    <div className="hidden md:block">
                        <div className="space-y-4">
                            {/* Barre de recherche globale */}
                            <div className="mb-4 px-4">
                                <input
                                    type="text"
                                    value={globalFilter ?? ''}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    placeholder="Rechercher..."
                                    className="px-4 py-2 border border-gray-300 rounded-lg w-full max-w-sm focus:outline-none focus:ring-2 ring-1 ring-gray-300 focus:ring-blue-500"
                                />
                            </div>

                            {/* Tableau */}
                            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow bg-white">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-red-500 hover:bg-red-600">
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <th
                                                        key={header.id}
                                                        className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-red-600 bg-[#fb2c36] hover:text-white capitalize select-none"
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        <div className="flex items-center justify-center gap-2">
                                                            {flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                            {header.column.getIsSorted() === 'asc' && ' 🔼'}
                                                            {header.column.getIsSorted() === 'desc' && ' 🔽'}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {table.getRowModel().rows.map((row) => (
                                            <tr key={row.id} className="transition-colors hover:bg-gray-50">
                                                {row.getVisibleCells().map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Indicateur de pagination */}
                            <div className="flex justify-between items-center text-sm text-gray-600 px-4">
                                <span>
                                    Page <strong>{currentPage}</strong> sur <strong>{filteredTotalPages}</strong>
                                </span>
                                <span>
                                    {filteredLivraisons.length} livraison{filteredLivraisons.length > 1 ? 's' : ''} au total
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Version Mobile */}
                    <div className="md:hidden space-y-4 p-4">
                        {filteredLivraisons.map((livraison: any, index: number) => (
                            <div
                                key={index}
                                className="border rounded-lg p-4 shadow-sm bg-card text-card-foreground"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{livraison.refCommande}</p>
                                        <h3 className="font-semibold text-sm md:text-lg">${formatDate(livraison.createdAt)}</h3>
                                    </div>
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-muted text-muted-foreground">
                                        {livraison.nomLivreur}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-4 text-sm mt-2">

                                    <div>
                                        <span className="text-muted-foreground">Coût commande:</span>
                                        <span className="font-bold ml-2 text-primary">{livraison.totalAmount}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center gap-4 text-sm mt-2">
                                    <div>
                                        <span className="text-muted-foreground">Commission(%):</span>
                                        <span className="font-bold ml-2 text-primary">{livraison.fraisLivraison} XOF</span>
                                    </div>
                                    <div className="text-center cursor-pointer ">
                                        <LivraisonDetailModal livraison={livraison} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message si aucune livraison */}
                    {filteredCurrentLivraisons.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Aucune livraison trouvée</p>
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={filteredTotalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredLivraisons.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />

                </CardContent>
            </Card>
        </div>
    )
}