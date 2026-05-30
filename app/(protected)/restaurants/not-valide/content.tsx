'use client';

import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination } from '@heroui/react';
import { title } from '@/components/primitives';
import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { RestaurantMobileCard, RestaurantMobileCardList } from '@/components/restaurants/restaurant-mobile-card';
import { createUrlFile } from '@/utils/createUrlFile';

interface ContentProps {
    initialData: PaginatedResponse<Restaurant> | null;
}

export default function Content({ initialData }: ContentProps) {
    const { columns, renderCell, renderCols, data, fetchData, currentPage, isLoading } = useContentCtx({ initialData });

    return (
        <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>Nouveaux restaurants</h1>
            </div>

            {/* Tableau (desktop ≥ md) */}
            <div className="hidden md:block">
                <Table aria-label="Example table with custom cells">
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid} align={'start'}>
                                {renderCols(column)}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody items={data?.content ?? []} emptyContent={<EmptyDataTable title="Aucun Restaurant" />}>
                        {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey) as React.ReactNode}</TableCell>}</TableRow>}
                    </TableBody>
                </Table>
            </div>

            {/* Cartes (mobile < md) — mêmes données et mêmes cellules (renderCell) que le tableau */}
            <RestaurantMobileCardList>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={`sk-card-${i}`} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
                    ))
                ) : (data?.content ?? []).length === 0 ? (
                    <EmptyDataTable title="Aucun Restaurant" />
                ) : (
                    (data?.content ?? []).map((restaurant) => (
                        <RestaurantMobileCard
                            key={restaurant.id}
                            nom={restaurant.nomEtablissement}
                            logoUrl={createUrlFile(restaurant?.logo_Url ?? '', 'restaurant')}
                            statut={renderCell(restaurant, 'status') as React.ReactNode}
                            fields={[
                                { label: 'Email', value: restaurant.email || '-' },
                                { label: 'Téléphone', value: restaurant.telephone || '-' },
                                { label: 'Localisation', value: restaurant.localisation || '-' },
                            ]}
                            actions={renderCell(restaurant, 'actions') as React.ReactNode}
                        />
                    ))
                )}
            </RestaurantMobileCardList>
            <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
                <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
                <Pagination total={data?.totalPages ?? 1} page={currentPage} onChange={fetchData} showControls color="primary" variant="bordered" isDisabled={isLoading} />
            </div>
        </div>
    );
}
