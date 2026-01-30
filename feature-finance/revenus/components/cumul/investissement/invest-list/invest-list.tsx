'use client';

import React, { useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, type SortingState, useReactTable } from '@tanstack/react-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddInvestModal } from '../creer-invest/add-invest-modal';
import { InvestDetailModal } from './invest-detail-modal';
import { ModifierInvestModal } from '../modifier/modifier-invest-modal';
import InvestissementDateFilter from '../filtres/filtres-par-date';
import { useInvestissementList } from '@/feature-finance/revenus/hooks/use-investissement-list';
import SupprimerInvestModal from '../supprimer/supprimer-invest-modal';
import { Input, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { formatCFA, formatDateFR } from '@/src/actions/bonLivraison.mapper';

export default function InvestissementList() {
  const { investissements, isLoading, filters, handleFilterChange, pagination } = useInvestissementList();
  const [sorting, setSorting] = useState<SortingState>([]);

  // TODO: Mettre les colonnes dans un fichier séparé
  const columns = useMemo(
    () => [
      {
        accessorKey: 'dateInvestissement',
        header: 'Date',
        cell: (info: any) => <div className="font-medium">{formatDateFR(info.getValue())}</div>,
      },
      {
        accessorKey: 'nomInvestisseur',
        header: 'Investisseur',
        cell: (info: any) => (
          <div className="">
            <span className="font-semibold rounded-full px-2 py-1 ">{info.getValue()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'montant',
        header: 'Montant du pret',
        cell: (info) => formatCFA(info.getValue()),
      },
      {
        accessorKey: 'deadline',
        header: 'Echéance',
        cell: (info) => formatDateFR(info.getValue()),
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: (info: any) => {
          const investissement = info.row.original;
          return (
            <div className="text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
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
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: investissements || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Input className="max-w-sm" type="text" value={filters.nomInvestisseur ?? ''} onChange={(e) => handleFilterChange('nomInvestisseur', e.target.value)} placeholder="Rechercher par nom..." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <InvestissementDateFilter dateInvestissement={filters.dateInvestissement} onFilterChange={handleFilterChange} />
          <AddInvestModal />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="hidden md:block">
          <div className="space-y-4">
            {/* Tableau HeroUI */}
            <div className="overflow-x-auto">
              <Table
                isStriped
                bottomContent={
                  pagination?.pageCount! > 1 && (
                    <div className="flex justify-center pt-4 sm:pt-6">
                      <Pagination total={pagination?.pageCount ?? 1} page={filters.page + 1} onChange={pagination.handlePageChange} color="primary" />
                    </div>
                  )
                }
              >
                <TableHeader>
                  {table.getFlatHeaders().map((header) => (
                    <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableColumn>
                  ))}
                </TableHeader>
                <TableBody emptyContent={'Aucun résultat trouvé.'} isLoading={isLoading} loadingContent={<Loader2 className="animate-spin" />}>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
