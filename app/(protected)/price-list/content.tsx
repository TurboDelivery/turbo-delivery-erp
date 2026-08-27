'use client';

import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { DeliveryFee } from '@/types/price-list';
import { Pagination, Tab, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs } from '@heroui/react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import Select from 'react-select';
import usePriceListTable from '@/features/price-list/hooks/use-price-list-table';
import { priceListColumns, usePriceListRenderCell } from '@/components/dashboard/price-liste/price-list-columns';
import PriceListFormModal from '@/components/dashboard/price-liste/price-list-form-modal';

const tabsItems = [
  { id: '/price-list', href: '/price-list', label: 'Liste des restaurants définis' },
  { id: '/price-list/restaurants-undefined', href: '/price-list/restaurants-undefined', label: 'Liste des restaurants indéfinis' },
];

const SKELETON_COUNT = 8;
const skeletonRows = Array.from({ length: SKELETON_COUNT }, (_, i) => ({ id: String(i) }) as DeliveryFee);

export default function Content() {
  const {
    selectedKey,
    tabs,
    deliveryFees,
    handleChangeSelectedKey,
    currentRestaurant,
    editModal,
    openEditModal,
    closeEditModal,
    isLoading,
    isFetching,
    pagination,
  } = usePriceListTable();

  const renderCell = usePriceListRenderCell({ currentRestaurant, onEdit: openEditModal });

  const restaurantOptions = tabs
    .map((tab) => ({ value: tab.id, label: tab.nomComplet }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const tableItems = (isLoading && !!selectedKey) ? skeletonRows : deliveryFees;

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
            onChange={(opt) => handleChangeSelectedKey(opt?.value ?? null)}
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

        {/* Tableau (desktop ≥ md) */}
        <div className="hidden md:block">
          <Table
            aria-label="Tableau de Frais de livraison"
            className={`mt-4 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}
            bottomContent={
              !isLoading && pagination.totalPages > 0 ? (
                <Pagination initialPage={pagination.currentPage} total={pagination.totalPages} onChange={pagination.onPageChange} />
              ) : null
            }
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
            <TableBody items={tableItems} emptyContent={!isLoading ? <EmptyDataTable title="Aucun frais de livraison" /> : ' '}>
              {(item) =>
                isLoading ? (
                  <TableRow key={item.id}>
                    {priceListColumns.map((col) => (
                      <TableCell key={col.uid}>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ) : (
                  <TableRow key={item.id} className={(item.actif ?? true) ? '' : 'opacity-50'}>
                    {priceListColumns.map((column) => (
                      <TableCell key={column.uid}>{renderCell(item, column.uid)}</TableCell>
                    ))}
                  </TableRow>
                )
              }
            </TableBody>
          </Table>
        </div>

        {/* Cartes (mobile < md) — mêmes données et mêmes actions (renderCell) que le tableau */}
        <div className="md:hidden mt-4 space-y-3">
          {isLoading && !!selectedKey ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`sk-card-${i}`} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
            ))
          ) : deliveryFees.length === 0 ? (
            <EmptyDataTable title="Aucun frais de livraison" />
          ) : (
            deliveryFees.map((fee) => (
              <div
                key={fee.id}
                className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2 ${(fee.actif ?? true) ? '' : 'opacity-50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{fee.name || fee.zone}</p>
                    {fee.name && <p className="text-xs text-gray-400 truncate">{fee.zone}</p>}
                  </div>
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderCell(fee, 'actions')}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Distance</span>
                  <span className="text-sm text-gray-700 text-right">{renderCell(fee, 'distance')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Coût de livraison</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{renderCell(fee, 'prix')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Commission</span>
                  <span className="text-sm text-gray-700 text-right">{renderCell(fee, 'commission')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Active</span>
                  <span className="text-right" onClick={(e) => e.stopPropagation()}>{renderCell(fee, 'actif')}</span>
                </div>
              </div>
            ))
          )}
          {!isLoading && pagination.totalPages > 0 && (
            <div className="flex justify-center pt-2">
              <Pagination initialPage={pagination.currentPage} total={pagination.totalPages} onChange={pagination.onPageChange} />
            </div>
          )}
        </div>
      </div>

      <PriceListFormModal
        mode="edit"
        open={editModal.open}
        onClose={closeEditModal}
        initialData={editModal.selectedFee}
      />
    </>
  );
}
