'use client';

import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { RestaurantDefini } from '@/types/price-list';
import { Pagination, Tab, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs } from '@heroui/react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import Select from 'react-select';
import usePriceListTable from '@/features/price-list/hooks/use-price-list-table';
import { priceListColumns, usePriceListRenderCell } from '@/components/dashboard/price-liste/price-list-columns';
import PriceListFormModal from '@/components/dashboard/price-liste/price-list-form-modal';

interface Props {
  initialData: RestaurantDefini[];
}

const tabsItems = [
  { id: '/price-list', href: '/price-list', label: 'Liste des restaurants définis' },
  { id: '/price-list/restaurants-undefined', href: '/price-list/restaurants-undefined', label: 'Liste des restaurants indéfinis' },
];

export default function Content({ initialData }: Props) {
  const {
    selectedKey,
    tabs,
    deliveryFees,
    handleChangeSelectedKey,
    currentRestaurant,
    editModal,
    openEditModal,
    closeEditModal,
    pagination,
  } = usePriceListTable({ initialData });

  const renderCell = usePriceListRenderCell({ currentRestaurant, onEdit: openEditModal });

  const restaurantOptions = tabs
    .map((tab) => ({ value: tab.id, label: tab.nomComplet }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <Tabs color="primary" variant="underlined" items={tabsItems} selectedKey={tabsItems.find((tab) => tab.id === '/price-list')?.id} className="w-full">
        {(item) => <Tab key={item.id} as={Link} href={item.href} title={item.label} />}
      </Tabs>

      <div className="flex flex-col mt-4">
        <div className="flex items-center gap-4 border shadow rounded-xl py-3 px-4">
          <Select
            options={restaurantOptions}
            value={restaurantOptions.find((o) => o.value === selectedKey) ?? null}
            onChange={(opt) => { if (opt?.value) handleChangeSelectedKey(opt.value); }}
            placeholder="Sélectionner un restaurant"
            isClearable
            className="text-xs w-full max-w-sm"
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({ ...base, minHeight: '36px', height: '36px', width: '100%' }),
              valueContainer: (base) => ({ ...base, height: '36px', padding: '0 8px' }),
              indicatorsContainer: (base) => ({ ...base, height: '36px' }),
            }}
          />
        </div>

        <Table
          aria-label="Tableau de Frais de livraison"
          className="mt-4"
          bottomContent={<Pagination initialPage={pagination.currentPage} total={pagination.totalPages} onChange={pagination.onPageChange} />}
        >
          <TableHeader columns={priceListColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                className={column.uid === 'zone' ? 'flex items-center gap-2' : ''}
                align={column.uid === 'actions' ? 'center' : 'start'}
              >
                {column.uid === 'zone' && <Search />} {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={deliveryFees} emptyContent={<EmptyDataTable title="Aucun Frais de Livraison" />}>
            {(item) => (
              <TableRow key={item.id}>
                {priceListColumns.map((column) => (
                  <TableCell key={column.uid}>{renderCell(item, column.uid)}</TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal d'édition */}
      <PriceListFormModal
        mode="edit"
        open={editModal.open}
        onClose={closeEditModal}
        initialData={editModal.selectedFee}
      />
    </>
  );
}
