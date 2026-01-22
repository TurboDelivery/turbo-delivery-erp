'use client';

import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { RestaurantDefini } from '@/types/price-list';
import { Pagination, Select, SelectItem, Tab, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs } from '@heroui/react';
import usePriceLiceDefined from './usePriceLiceDefined';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface Props {
  initialData: RestaurantDefini[];
}

const tabsItems = [
  { id: '/price-list', href: '/price-list', label: 'Liste des restaurants définis' },
  { id: '/price-list/restaurants-undefined', href: '/price-list/restaurants-undefined', label: 'Liste des restaurants indéfinis' },
];

export default function Content({ initialData }: Props) {
  const { columns, selectedKey, tabs, deliveryFees, renderCell, handleChangeSelectedKey, pagination } = usePriceLiceDefined({ initialData });

  return (
    <>
      {/* Onglets de navigation globale */}
      <Tabs color="primary" variant="underlined" items={tabsItems} selectedKey={tabsItems.find((tab) => tab.id === '/price-list')?.id} className="w-full">
        {(item) => <Tab key={item.id} as={Link} href={item.href} title={item.label} />}
      </Tabs>

      {/* Contenu de la page */}
      <div className="flex flex-col mt-4">
        <div className="flex items-center gap-4 border shadow rounded-xl py-3 px-4">
          <Select
            className="max-w-sm"
            items={tabs.sort((a, b) => a.nomComplet.localeCompare(b.nomComplet))}
            label="Sélectionner un restaurant"
            placeholder="Choisir un restaurant"
            selectedKeys={selectedKey ? [selectedKey] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              if (selected) handleChangeSelectedKey(selected);
            }}
          >
            {(item) => <SelectItem key={item.id}>{item.nomComplet}</SelectItem>}
          </Select>
        </div>
        {/* Tableau de frais de livraison */}
        <Table
          aria-label="Tableau de Frais de livraison"
          className="mt-4"
          bottomContent={<Pagination initialPage={pagination.currentPage} total={pagination.totalPages} onChange={pagination.onPageChange} />}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} className={column.uid === 'zone' ? 'flex items-center gap-2' : ''} align={column.uid === 'actions' ? 'center' : 'start'}>
                {column.uid === 'zone' && <Search />} {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={deliveryFees} emptyContent={<EmptyDataTable title="Aucun Frais de Livraison" />}>
            {(item) => (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={column.uid}>{renderCell(item, column.uid)}</TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
