'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { RestaurantSelect } from '../common/restaurant-select';
import DateFilterInput from '@/components/finance/date-filter-input';
import { useAccompteQuery } from '@/features/recouvrements/queries/accompte.query';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import { accompteColumns } from '@/features/recouvrements/columns/accompte-columns';
import { DateRange } from 'react-day-picker';
import { IAccompte } from '@/features/recouvrements/types/accompte.types';

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
  
  // Utiliser l'API réelle avec tous les filtres
  const { data: accomptesData, isLoading, error } = useAccompteQuery({
    page: 0,
    limit: 20,
    restaurantId: selectedRestaurant || undefined,
    debut: dateRange?.from,
    fin: dateRange?.to,
    statuts: selectedStatuts.length > 0 ? selectedStatuts : undefined,
  });

  const accomptes = accomptesData?.content || [];
  const pagination = accomptesData?.pageable;

  // Calcul des statistiques à partir des données réelles
  const stats = {
    totalAccompte: accomptes.reduce((sum, a) => sum + a.montant, 0),
    nombreAccomptes: accomptes.length,
    accompteValides: accomptes.filter(a => a.montant > 0).reduce((sum, a) => sum + a.montant, 0),
    accompteEnAttente: accomptes.filter(a => a.montant === 0).length,
  };

  const handleDateChange = (value: DateRange | undefined) => {
    setDateRange(value);
  };

  const handleStatutsChange = (statuts: string[] | null) => {
    setSelectedStatuts(statuts || []);
  };

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
                <p className="text-2xl font-bold text-green-600">
                  {formatCFA(stats.totalAccompte)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre d'Accomptes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.nombreAccomptes}
                </p>
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
                <p className="text-2xl font-bold text-purple-600">
                  {formatCFA(stats.accompteValides)}
                </p>
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
                <p className="text-2xl font-bold text-orange-600">
                  {stats.accompteEnAttente}
                </p>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {accompteColumns.map((column) => (
                  <TableColumn className="text-primary" key={column.id} allowsSorting={column.enableSorting}>
                    {column.header as string}
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {accompteColumns.map((col) => (
                          <TableCell key={`skeleton-cell-${col.id}`} className="h-12">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : accomptes.map((accompte: any) => (
                      <TableRow key={accompte.id}>
                        {accompteColumns.map((column) => (
                          <TableCell key={column.id}>
                            {column.cell && typeof column.cell === 'function' 
                              ? column.cell({ original: accompte } as any) 
                              : column.id && accompte[column.id as keyof IAccompte]
                            }
                          </TableCell>
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
                      currentSearchParams.statuts.forEach(statut => params.append('statuts', statut));
                    }
                    params.append('page', (page - 1).toString());
                    params.append('limit', '10');
                    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
