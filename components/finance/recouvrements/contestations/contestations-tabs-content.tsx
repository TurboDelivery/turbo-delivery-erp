'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectItem, Spinner, Pagination } from '@heroui/react';
import useContestationsDashboard from '@/features/recouvrements/hooks/use-contestations-dashboard';
import { useContestationsQuery } from '@/features/recouvrements/queries/contestation.query';
import { RestaurantSelect } from '../common/restaurant-select';
import DateFilterInput from '@/components/finance/date-filter-input';
import { IContestation } from '@/features/recouvrements/types';
import { ContestationCard } from './contestation-card';

interface ContestationsTabsContentProps {
  restoOpts: Array<{ value: string; label: string }>;
  isOptionsLoading?: boolean;
}

export function ContestationsTabsContent({ restoOpts, isOptionsLoading }: ContestationsTabsContentProps) {
  const { filters, handleDateChange, handleRestaurantChange, handleStatusChange } = useContestationsDashboard();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.restaurantId, filters.debut, filters.fin, filters.status]);

  const { data: contestationsData, isLoading, refetch } = useContestationsQuery(
    {
      factureId: filters.restaurantId || '',
      debut: filters.debut?.toISOString().split('T')[0],
      fin: filters.fin?.toISOString().split('T')[0],
      page: currentPage - 1,
      size: pageSize,
    },
  );

  // Filtrer les contestations par statut si sélectionné
  const filteredContestations = React.useMemo(() => {
    if (!contestationsData?.content || !filters.status) {
      return contestationsData?.content || [];
    }
    return contestationsData.content.filter((c) => c.statut === filters.status);
  }, [contestationsData, filters.status]);

  const totalPages = contestationsData?.totalPages || 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4 pb-4">
        <h2 className="text-lg font-medium">Contestations</h2>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 w-full flex-wrap">
          <RestaurantSelect
            value={filters.restaurantId}
            onChange={handleRestaurantChange}
            options={restoOpts}
            isLoading={isOptionsLoading}
            placeholder="Sélectionner un restaurant"
            className="w-full sm:w-[280px]"
          />

          <DateFilterInput
            filters={{
              debut: filters.debut,
              fin: filters.fin,
            }}
            handleDateChange={handleDateChange}
            variant="secondary"
          />

          <Select
            label="Statut"
            variant="bordered"
            selectedKeys={filters.status ? [filters.status] : []}
            onChange={(e) => handleStatusChange(e.target.value || '')}
            className="w-full max-w-xs"
          >
            <SelectItem key="">Tous les statuts</SelectItem>
            <SelectItem key="ACTIVE">Active</SelectItem>
            <SelectItem key="RESOLUE">Résolue</SelectItem>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="w-full">
        {filters.restaurantId && isLoading && (
          <div className="flex justify-center items-center py-12">
            <Spinner label="Chargement des contestations..." />
          </div>
        )}

        {!isLoading && filteredContestations.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredContestations.map((contestation: IContestation) => (
                <ContestationCard
                  key={contestation.id}
                  contestation={contestation}
                  onResolve={() => refetch()}
                />
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-4">
                <Pagination
                  total={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showControls
                  isCompact
                />
              </div>
            )}
          </>
        )}

        {filters.restaurantId && !isLoading && filteredContestations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Aucune contestation trouvée</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




