'use client';

import React from 'react';
import { useQueryStates } from 'nuqs';
import { factureFiltersClient } from '@/features/recouvrements/filters/facture.filter';
import { FactureTable } from './facture-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Select from 'react-select';

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
        <Select
          options={restoOpts}
          value={restoOpts.find((o) => o.value === filters.restaurantId) ?? null}
          onChange={(opt) => handleRestaurantFilterChange(opt?.value)}
          placeholder="Restaurant"
          isClearable
          isLoading={isOptionsLoading}
          isDisabled={isOptionsLoading}
          className="text-xs w-full max-w-md"
          classNamePrefix="react-select"
          styles={{
            control: (base) => ({
              ...base,
              minHeight: '36px',
              height: '36px',
              width: '100%',
            }),
            valueContainer: (base) => ({
              ...base,
              height: '36px',
              padding: '0 8px',
            }),
            indicatorsContainer: (base) => ({
              ...base,
              height: '36px',
            }),
          }}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <FactureTable />
      </CardContent>
    </Card>
  );
}
