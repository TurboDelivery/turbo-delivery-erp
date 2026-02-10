'use client';

import React from 'react';
import { useQueryStates } from 'nuqs';
import { factureFiltersClient } from '@/features/recouvrements/filters/facture.filter';
import { FactureTable } from './facture-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RestaurantSelect } from '../common/restaurant-select';

interface FactureTabsContentProps {
  restoOpts: {
    label: string;
    value: string;
  }[];
  isOptionsLoading?: boolean;
}

export function FactureTabsContent({ restoOpts, isOptionsLoading }: FactureTabsContentProps) {
  const [filters, setFilters] = useQueryStates(factureFiltersClient.filter, factureFiltersClient.option);

  const handleRestaurantFilterChange = (restoId?: string) => {
    setFilters((prev) => ({
      ...prev,
      restaurantId: restoId || '',
      page: 0,
    }));
  };

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="flex flex-wrap">
        <h2 className="text-lg font-medium">Factures</h2>
        <RestaurantSelect
          value={filters.restaurantId}
          onChange={handleRestaurantFilterChange}
          options={restoOpts}
          isLoading={isOptionsLoading}
          placeholder="Restaurant"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <FactureTable />
      </CardContent>
    </Card>
  );
}
