'use client';
import React from 'react';
import { RestaurantsTable } from '@/components/finance/recouvrements/restaurants/restaurants-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useRecouvrementDashboard from '@/features/recouvrements/hooks/use-recouvrement-dashboard';
import { RecouvrementTabsType } from '@/features/recouvrements/types';
import { useDefinedRestaurantsQuery } from '@/features/restaurants/queries/restaurants.query';
import { toRestaurantOptions } from '@/features/restaurants/utils/restaurant-options';
import { FactureTabsContent } from '@/components/finance/recouvrements/factures/facture-tabs-content';

function RecouvrementContentTabs() {
  const { filters, handleTabChange } = useRecouvrementDashboard();
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useDefinedRestaurantsQuery();
  const restoOpts = toRestaurantOptions(restaurants);

  return (
    <>
      <Tabs defaultValue="factures" className="w-full" value={filters.tab} onValueChange={(value) => handleTabChange(value as RecouvrementTabsType)}>
        <TabsList className="grid grid-cols-2 w-full gap-2">
          <TabsTrigger value="factures" className="bg-red-300">
            Toutes les factures
          </TabsTrigger>
          {/*<TabsTrigger value="recouvrements" className="bg-green-300">*/}
          {/*  Liste des Recouvrements*/}
          {/*</TabsTrigger>*/}
          <TabsTrigger value="restaurants" className="bg-blue-300">
            Liste des restaurants
          </TabsTrigger>
        </TabsList>
        <TabsContent value="factures">
          <FactureTabsContent restoOpts={restoOpts} />
        </TabsContent>
        {/*<TabsContent value="recouvrements">*/}
        {/*  <div className="p-4">Contenu des factures à implémenter</div>*/}
        {/*</TabsContent>*/}
        <TabsContent value="restaurants">
          <RestaurantsTable restoOpts={restoOpts} isOptionsLoading={isRestaurantsLoading} />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default RecouvrementContentTabs;
