'use client';

import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { RestaurantDefini } from '@/types/price-list';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Tabs, Tab } from '@heroui/react';
import useContent from './useContent';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { RestaurantMobileCard, RestaurantMobileCardList } from '@/components/restaurants/restaurant-mobile-card';
import { createUrlFile } from '@/utils/createUrlFile';

interface Props {
  initialData: RestaurantDefini[];
}

export const columns = [
  { name: 'Nom du restaurent', uid: 'nomEtablissement', align: 'start' },
  { name: 'Actions', uid: 'actions', align: 'end' },

];

const tabsItems: {
  id: string;
  href: string;
  label: string;
}[] = [
    { id: '/price-list', href: '/price-list', label: 'Liste des restaurants definis' },
    { id: '/price-list/restaurants-undefined', href: '/price-list/restaurants-undefined', label: 'Liste des restaurants indefinis' },
  ];

export default function Content({ initialData }: Props) {
  const { undefinedRestaurant, renderCell } = useContent({ initialData });

  return (
    <Tabs color="primary" variant="underlined" items={tabsItems} selectedKey={'/price-list/restaurants-undefined'} className="w-full">
      {(item) => {
        return (
          <Tab key={item.id} as={Link} href={item.href} title={item.label}>
            {/* Tableau (desktop ≥ md) */}
            <div className="hidden md:flex flex-col">
              <Table aria-label="Tableau de Frais de livraison">
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn
                    className={`${column.uid == 'nomEtablissement' ? 'flex items-center gap-2' : ''}`}
                    key={column.uid}
                    align={column.align as 'start' | 'end' | 'center'}
                    >
                      {column.uid === 'nomEtablissement' && <Search />} {column.name}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody items={undefinedRestaurant ? undefinedRestaurant : []} emptyContent={<EmptyDataTable title="Aucun frais de livraison" />}>
                  {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>}
                </TableBody>
              </Table>
            </div>

            {/* Cartes (mobile < md) — mêmes données et même action (renderCell) que le tableau */}
            <RestaurantMobileCardList>
              {(undefinedRestaurant ?? []).length === 0 ? (
                <EmptyDataTable title="Aucun frais de livraison" />
              ) : (
                (undefinedRestaurant ?? []).map((restaurant) => (
                  <RestaurantMobileCard
                    key={restaurant.id}
                    nom={restaurant.nomEtablissement}
                    logoUrl={createUrlFile(restaurant.logo_Url, 'restaurant')}
                    actions={renderCell(restaurant, 'actions') as React.ReactNode}
                  />
                ))
              )}
            </RestaurantMobileCardList>
          </Tab>
        );
      }}
    </Tabs>
  );
}
