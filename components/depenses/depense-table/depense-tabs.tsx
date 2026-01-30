'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DepenseTable } from './index';
import { CategorieDepenseList } from '@/feature-finance/depenses/components/depense-list/categorie-depense';

export default function DepenseTabs() {
  return (
    <Tabs defaultValue="depenses-journalieres" className="w-full">
      <TabsList className="grid grid-cols-2 w-full gap-2">
        <TabsTrigger value="depenses-journalieres">Liste des dépenses</TabsTrigger>
        <TabsTrigger value="categories-depenses">Liste des catégories</TabsTrigger>
      </TabsList>
      <TabsContent value="depenses-journalieres">
        <DepenseTable />
      </TabsContent>
      <TabsContent value="categories-depenses">
        <CategorieDepenseList />
      </TabsContent>
    </Tabs>
  );
}
