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
import { Edit, Eye, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddInvestModal } from "../creer-invest/add-invest-modal"
import { InvestDetailModal } from "./invest-detail-modal"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { ModifierInvestModal } from "../modifier/modifier-invest-modal"
import InvestisseurNameFilter from "../filtres/filtre-nom-investisseur"
import InvestissementDateFilter from "../filtres/filtres-par-date"
import { useInvestissementList } from "@/feature-finance/revenus/hooks/use-investissement-list";
import SupprimerInvestModal from "../supprimer/supprimer-invest-modal"
import { Pagination } from "../../livraison/livraison-list/pagination"

export default function InvestissementList() {
    const { investissements, isLoading, isError, error } = useInvestissementList();
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // S'assurer que investissements est un tableau
    const investissementsArray = Array.isArray(investissements) ? investissements : []

    // Pagination
    const totalPages = Math.ceil(investissementsArray.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentInvestissements = investissementsArray.slice(startIndex, startIndex + itemsPerPage)

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

    const formatDateForMobile = (dateString: string) => {
        if (!dateString) return "";

        try {
            const date = parseISO(dateString);
            return format(date, "dd/MM/yy", { locale: fr });
        } catch (error) {
            return dateString.split('T')[0];
        }
    }

    // Définition des colonnes pour TanStack Table
    const columns = useMemo(() => [
        {
            accessorKey: 'dateInvestissement',
            header: 'Date',
            cell: (info: any) => (
                <div className="font-medium text-center">
                    {formatDate(info.getValue())}
                </div>
            ),
        },
        {
            accessorKey: 'nomInvestisseur',
            header: 'Investisseur',
            cell: (info: any) => (
                <div className="text-center">
                    <span className="font-semibold rounded-full px-2 py-1 text-center">
                        {info.getValue()}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'montant',
            header: 'Montant du pret',
            cell: (info: any) => (
                <div className="text-center">
                    {info.getValue()} FCFA
                </div>
            ),
        },
        {
            accessorKey: 'deadline',
            header: 'Echéance',
            cell: (info: any) => (
                <div className="text-center">
                    {formatDate(info.getValue())}
                </div>
            ),
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            cell: (info: any) => {
                const investissement = info.row.original
                return (
                    <div className="text-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-red-400 hover:bg-red-600 cursor-pointer">
                                    <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <InvestDetailModal investissement={investissement} />
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <ModifierInvestModal investissement={investissement} />
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <SupprimerInvestModal investissement={investissement} />
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ], [])

    const table = useReactTable({
        data: investissements || [],
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
                <p>Chargement des investissements...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex justify-center items-center p-8">
                <p className="text-red-500">Erreur lors du chargement des investissements</p>
            </div>
        );
    }

    return (
        <div className="">
            <Card className="shadow-lg border-0">
                <CardHeader>
                    <CardTitle>
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-sm md:text-xl lg:text-2xl">Liste des investissements</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-normal font-exo text-sm">
                                <InvestissementDateFilter />
                                <InvestisseurNameFilter />
                                <AddInvestModal />
                            </div>
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
                                                        className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-red-600 bg-[#fb2c36] select-none"
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
                                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b-2"
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Version Mobile */}
                    <div className="md:hidden space-y-4 p-4">
                        {investissements?.map((investissement: any) => (
                            <div key={investissement.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <p className="text-sm text-gray-500">
                                        {formatDateForMobile(investissement.dateInvestissement)}
                                    </p>
                                    <h3 className="font-semibold rounded-md px-2 text-sm">
                                        {investissement.nomInvestisseur}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Montant total :</span>
                                        <span className="text-black ml-2">{investissement.montant} FCFA</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Echéance :</span>
                                        <span className="text-black ml-2">{formatDateForMobile(investissement.deadline)}</span>
                                    </div>
                                    <div className="text-right">
                                        <Button variant="default" size="sm">
                                            <Eye className="h-4 w-4 mr-1" />
                                        </Button>
                                        <ModifierInvestModal investissement={investissement} />
                                        <SupprimerInvestModal investissement={investissement} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message si aucun investissement */}
                    {!investissements || investissements.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>Aucun investissement trouvé</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}