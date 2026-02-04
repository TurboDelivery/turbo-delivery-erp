'use client';

import React, { useMemo, useState } from 'react';
import { type ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type SortingState, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { IFacture } from '@/feature-finance/revenus/types/recouvrement/prets.types';
import { PretDetailModal } from './pret-detail-modal';

interface IPretTableProps {
  facture: IFacture[];
  formatDate: (dateString: string) => string;
  formatMontant: (montant: number) => string;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
}

export function PretTable({ facture, formatMontant, currentPage = 1, totalPages = 1, totalItems = 0 }: IPretTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Définition des colonnes pour TanStack Table
  const columns = useMemo(
    () => [
      {
        accessorKey: 'nomRestaurant',
        header: 'Partenaire',
        cell: (info: any) => <div className="text-center text-sm uppercase">{info.getValue()}</div>,
      },
      {
        accessorKey: 'totalFraisLivraisons',
        header: 'frais de livraison',
        cell: (info: any) => <div className="font-semibold text-center text-sm">{formatMontant(info.getValue())} FCFA</div>,
      },
      {
        accessorKey: 'totalCommission',
        header: 'commission',
        cell: (info: any) => <div className="font-semibold text-center text-sm">{formatMontant(info.getValue())} FCFA</div>,
      },
      {
        accessorKey: 'totalFacture',
        header: 'total facture',
        cell: (info: any) => {
          const row = info.row.original;
          const total = row.totalFraisLivraisons + row.totalCommission;
          return <div className="text-center font-semibold text-red-600">{formatMontant(total)} FCFA</div>;
        },
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: (info: any) => {
          const facture = info.row.original;
          return (
            <div className="text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <PretDetailModal facture={facture} />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [formatMontant],
  );

  const table = useReactTable({
    data: facture,
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
    // Pas de pagination - gérée par le composant parent
  });

  return (
    <>
      {/* Version Desktop */}
      <div className="hidden md:block">
        <div className="space-y-4 mt-2">
          {/* Barre de recherche globale */}
          <div className="mb-4 ">
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
                          {flexRender(header.column.columnDef.header, header.getContext())}
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
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Indicateur de pagination */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong>
            </span>
            <span>
              {totalItems} élément{totalItems > 1 ? 's' : ''} au total
            </span>
          </div>
        </div>
      </div>

      {/* Version Mobile */}
      <div className="md:hidden space-y-4 p-4">
        {facture.map((facture) => (
          <div key={facture.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-sm md:text-base uppercase">{facture.nomRestaurant}</h3>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-600 text-sm">Montant facture:</span>
                <span className="font-bold text-red-600 ml-2">{formatMontant(facture.totalFraisLivraisons + facture.totalCommission)} FCFA</span>
              </div>
              <div className="mt-3">
                <PretDetailModal facture={facture} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
