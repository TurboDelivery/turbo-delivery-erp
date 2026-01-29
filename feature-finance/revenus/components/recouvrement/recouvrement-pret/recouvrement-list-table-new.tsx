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
import { Button } from "@/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Download, Trash2 } from "lucide-react"
import { IRecouvrement } from "@/feature-finance/revenus/types/recouvrement/recouvrement.types"
import { usePretList } from "@/feature-finance/revenus/hooks/use-pret-list"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Image from "next/image"
import { getFullUrlFile } from "@/utils/getFullUrlFile"

interface IRecouvrementTableProps {
    recouvrement: IRecouvrement[]
    formatMontant: (montant: number) => string
    formatDate: (dateString: string) => string
    onViewDetails?: (recouvrement: IRecouvrement) => void
    handleFilterChange: (filterName: string, value: string) => void
}

export function RecouvrementListTable({
    recouvrement,
    formatMontant,
    formatDate,
    onViewDetails,
    handleFilterChange
}: IRecouvrementTableProps) {
    const { facture } = usePretList()
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    // 🔹 utilitaires calcul
    const getTotalFacturePourRestaurant = (restaurantId: string) => {
        const factureRestaurant = facture.find(f => f.id === restaurantId)
        return factureRestaurant
            ? factureRestaurant.totalCommission + factureRestaurant.totalFraisLivraisons
            : 0
    }

    const getCumulRecouvrementsAvant = (recouvActuel: IRecouvrement) => {
        const list = recouvrement
            .filter(r => r.restaurantId === recouvActuel.restaurantId)
            .sort((a, b) => new Date(a.dateRecouvrement).getTime() - new Date(b.dateRecouvrement).getTime())

        const index = list.findIndex(r => r.id === recouvActuel.id)
        return index === -1 ? 0 : list.slice(0, index).reduce((sum, r) => sum + r.montant, 0)
    }

    const getMontantCumuleJusquAPresent = (recouv: IRecouvrement) =>
        getCumulRecouvrementsAvant(recouv) + recouv.montant

    const getResteApresRecouvrement = (recouv: IRecouvrement) => {
        const total = getTotalFacturePourRestaurant(recouv.restaurantId)
        return Math.max(0, total - getMontantCumuleJusquAPresent(recouv))
    }

    const getResteAvantRecouvrement = (recouv: IRecouvrement) => {
        const total = getTotalFacturePourRestaurant(recouv.restaurantId)
        return Math.max(0, total - getCumulRecouvrementsAvant(recouv))
    }

    // Définition des colonnes pour TanStack Table
    const columns = useMemo(() => [
        {
            accessorKey: 'restaurantId',
            header: 'Partenaire',
            cell: (info: any) => {
                const recouv = info.row.original
                const factureRestaurant = facture.find(f => f.id === recouv.restaurantId)
                return (
                    <div className="text-center text-sm font-medium uppercase">
                        {factureRestaurant?.nomRestaurant || 'Restaurant inconnu'}
                    </div>
                )
            },
        },
        {
            accessorKey: 'montant',
            header: 'Montant total',
            cell: (info: any) => (
                <div className="font-semibold text-center text-sm text-green-600">
                    {formatMontant(info.getValue())} FCFA
                </div>
            ),
        },
        {
            accessorKey: 'montantCumule',
            header: 'Montant cumulé',
            cell: (info: any) => {
                const recouv = info.row.original
                const cumule = getMontantCumuleJusquAPresent(recouv)
                return (
                    <div className="font-semibold text-center text-sm text-blue-600">
                        {formatMontant(cumule)} FCFA
                    </div>
                )
            },
        },
        {
            accessorKey: 'resteApres',
            header: 'Reste à recouvrir',
            cell: (info: any) => {
                const recouv = info.row.original
                const reste = getResteApresRecouvrement(recouv)
                return (
                    <div className={`font-semibold text-center text-sm ${reste > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMontant(reste)} FCFA
                    </div>
                )
            },
        },
        {
            accessorKey: 'dateRecouvrement',
            header: 'Date',
            cell: (info: any) => (
                <div className="text-center text-sm">
                    {formatDate(info.getValue())}
                </div>
            ),
        },
        {
            accessorKey: 'preuve',
            header: 'Preuve',
            cell: (info: any) => {
                const recouv = info.row.original
                return (
                    <div className="text-center">
                        {recouv.preuve ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedImage(getFullUrlFile(recouv.preuve))}
                                className="cursor-pointer"
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                            </Button>
                        ) : (
                            <span className="text-gray-400 text-sm">Aucune</span>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            cell: (info: any) => {
                const recouv = info.row.original
                return (
                    <div className="text-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="cursor-pointer">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {recouv.preuve && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = getFullUrlFile(recouv.preuve);
                                                link.download = recouv.preuve;
                                                link.click();
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Télécharger la preuve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setSelectedImage(getFullUrlFile(recouv.preuve))}
                                            className="cursor-pointer"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Agrandir la preuve
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {onViewDetails && (
                                    <DropdownMenuItem
                                        onClick={() => onViewDetails(recouv)}
                                        className="cursor-pointer"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Voir les détails
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ], [formatMontant, formatDate, facture, recouvrement, onViewDetails])

    const table = useReactTable({
        data: recouvrement,
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

    return (
        <>
            {/* Modal pour l'image */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-4xl p-0 bg-black">
                    {selectedImage && (
                        <Image
                            src={selectedImage}
                            alt="Preuve agrandie"
                            width={1200}
                            height={800}
                            className="w-full h-auto object-contain"
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Version Desktop */}
            <div className="hidden md:block">
                <div className="space-y-4 mt-2">
                    {/* Barre de recherche globale */}
                    <div className="mb-4">
                        <input
                            type="text"
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Rechercher un recouvrement..."
                            className="px-4 py-2 border border-gray-300 rounded-lg w-full max-w-sm focus:outline-none focus:ring-2 ring-1 ring-gray-300 focus:ring-blue-500"
                        />
                    </div>

                    {/* Tableau */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow bg-white">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#fb2c36]">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-red-600 bg-red-600 select-none"
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
                {recouvrement.map((recouv) => {
                    const factureRestaurant = facture.find(f => f.id === recouv.restaurantId)
                    const cumule = getMontantCumuleJusquAPresent(recouv)
                    const reste = getResteApresRecouvrement(recouv)
                    
                    return (
                        <div key={recouv.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm uppercase">
                                        {factureRestaurant?.nomRestaurant || 'Restaurant inconnu'}
                                    </h3>
                                    <p className="text-xs text-gray-500">{formatDate(recouv.dateRecouvrement)}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-green-600">
                                        {formatMontant(recouv.montant)} FCFA
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                    <span className="text-gray-600 text-xs">Cumulé:</span>
                                    <div className="font-semibold text-blue-600 text-sm">
                                        {formatMontant(cumule)} FCFA
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600 text-xs">Reste:</span>
                                    <div className={`font-semibold text-sm ${reste > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatMontant(reste)} FCFA
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    {recouv.preuve ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedImage(getFullUrlFile(recouv.preuve))}
                                            className="cursor-pointer"
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Preuve
                                        </Button>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Aucune preuve</span>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline" className="cursor-pointer">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {recouv.preuve && (
                                            <>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = getFullUrlFile(recouv.preuve);
                                                        link.download = recouv.preuve;
                                                        link.click();
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Télécharger
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setSelectedImage(getFullUrlFile(recouv.preuve))}
                                                    className="cursor-pointer"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Agrandir
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}
