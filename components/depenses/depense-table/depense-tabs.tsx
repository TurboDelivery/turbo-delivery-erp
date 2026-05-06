'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DepenseTable } from './index';
import { CategorieDepenseList } from '@/features/depenses/components/depense-list/categorie-depense';

export default function DepenseTabs() {
  return (
    <Tabs defaultValue="depenses-journalieres" className="w-full">
      <TabsList className="grid grid-cols-2 w-full gap-2">
        <TabsTrigger value="depenses-journalieres">Liste des dÃ©penses</TabsTrigger>
        <TabsTrigger value="categories-depenses">Liste des catÃ©gories</TabsTrigger>
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

