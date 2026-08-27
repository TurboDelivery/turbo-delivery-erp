'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { RestaurantSelect } from '../common/restaurant-select';
import { useAccompteQuery } from '@/features/recouvrements/queries/accompte.query';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { accompteColumns } from '@/features/recouvrements/columns/accompte-columns';
import { DateRange } from 'react-day-picker';
import { AccompteMobileCard } from '@/components/finance/recouvrements/recouvrement-mobile-cards';

interface AccompteTabsContentProps {
  restoOpts?: Array<{ label: string; value: string }>;
  isOptionsLoading?: boolean;
}

export function AccompteTabsContent({ restoOpts, isOptionsLoading }: AccompteTabsContentProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [selectedStatuts, setSelectedStatuts] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date('2026-03-01'),
    to: new Date('2026-03-31'),
  });
  const [filters, setFilters] = useState({
    page: 0,
    size: 10,
  });

  // Utiliser l'API réelle avec tous les filtres
  const {
    data: accomptesData,
    isLoading,
    isFetching,
  } = useAccompteQuery({
    page: 0,
    limit: 20,
    restaurantId: selectedRestaurant || undefined,
    debut: dateRange?.from,
    fin: dateRange?.to,
    statuts: selectedStatuts.length > 0 ? selectedStatuts : undefined,
  });

  const pagination = {
    pageCount: accomptesData?.totalPages || 1,
    page: filters.page,
    pageSize: filters.size,
    handlePageChange: (newPage: number) => setFilters({ page: newPage - 1, size: 10 }),
  };

  const table = useReactTable({
    data: accomptesData?.content || [],
    columns: accompteColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination?.pageCount ?? -1,
  });

  const accomptes = accomptesData?.content || [];

  // Calcul des statistiques à partir des données réelles
  const stats = {
    totalAccompte: accomptes.reduce((sum, a) => sum + a.montant, 0),
    nombreAccomptes: accomptes.length,
    accompteValides: accomptes.filter((a) => a.montant > 0).reduce((sum, a) => sum + a.montant, 0),
    accompteEnAttente: accomptes.filter((a) => a.montant === 0).length,
  };

  // const handleDateChange = (value: DateRange | undefined) => {
  //   setDateRange(value);
  // };
  //
  // const handleStatutsChange = (statuts: string[] | null) => {
  //   setSelectedStatuts(statuts || []);
  // };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <RestaurantSelect
          value={selectedRestaurant}
          onChange={(value) => setSelectedRestaurant(value || '')}
          options={restoOpts || []}
          isLoading={isOptionsLoading}
          placeholder="Tous les restaurants"
          className="w-full sm:w-[280px]"
        />
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Accompte</p>
                <p className="text-2xl font-bold text-green-600">{formatCFA(stats.totalAccompte)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre d&#39;Accomptes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.nombreAccomptes}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accomptes Validés</p>
                <p className="text-2xl font-bold text-purple-600">{formatCFA(stats.accompteValides)}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.accompteEnAttente}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des acomptes */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Accomptes</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tableau — desktop uniquement (≥ md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table
              bottomContent={
                pagination &&
                pagination.pageCount > 1 && (
                  <div className="flex justify-center pt-4 sm:pt-6">
                    <Pagination total={pagination.pageCount} page={pagination.page + 1} onChange={pagination.handlePageChange} color="primary" />
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
              <TableBody emptyContent={'Aucun acompte'}>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {Array.from({ length: table.getAllColumns().length }).map((_, j) => (
                          <TableCell key={`skeleton-cell-${j}`} className="h-12">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={isFetching ? 'opacity-70' : ''}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {accomptesData && accomptesData.totalPages > 1 && (
              <div className="flex justify-center pt-4">
                <Pagination
                  total={accomptesData.totalElements}
                  page={accomptesData.number + 1}
                  onChange={(page) => {
                    const currentSearchParams = {
                      page: page - 1,
                      limit: 10,
                      restaurantId: selectedRestaurant,
                      debut: dateRange?.from,
                      fin: dateRange?.to,
                      statuts: selectedStatuts.length > 0 ? selectedStatuts : undefined,
                    };
                    // Mettre à jour l'URL manuellement
                    const params = new URLSearchParams();
                    if (currentSearchParams.restaurantId) params.append('restaurantId', currentSearchParams.restaurantId);
                    if (currentSearchParams.debut) params.append('debut', currentSearchParams.debut.toISOString().split('T')[0]);
                    if (currentSearchParams.fin) params.append('fin', currentSearchParams.fin.toISOString().split('T')[0]);
                    if (currentSearchParams.statuts) {
                      currentSearchParams.statuts.forEach((statut) => params.append('statuts', statut));
                    }
                    params.append('page', (page - 1).toString());
                    params.append('limit', '10');
                    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                  }}
                />
              </div>
            )}
          </div>

          {/* Mobile — cartes tactiles (remplace le tableau < md) */}
          <div className={`md:hidden space-y-3 ${isFetching ? 'opacity-70' : ''}`}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={`m-skel-${i}`} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />)
            ) : accomptes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Aucun acompte</p>
            ) : (
              accomptes.map((accompte) => <AccompteMobileCard key={accompte.id} accompte={accompte} />)
            )}
            {pagination && pagination.pageCount > 1 && (
              <div className="flex justify-center pt-2">
                <Pagination total={pagination.pageCount} page={pagination.page + 1} onChange={pagination.handlePageChange} color="primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
