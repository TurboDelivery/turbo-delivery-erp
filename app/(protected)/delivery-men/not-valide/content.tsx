'use client';

import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination, Spinner } from '@/components/heroui';
import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import { DeliveryMan } from '@/types/models';
import EmptyDataTable from '@/components/commons/EmptyDataTable';

interface ContentProps {
    initialData: PaginatedResponse<DeliveryMan> | null;
}

export default function Content({ initialData }: ContentProps) {
    const { columns, renderCell, renderCols, data, fetchData, currentPage, isLoading } = useContentCtx({ initialData });

    const rows = data?.content ?? [];

    return (
        <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary">Nouveaux livreurs</h1>
            </div>
            {/* Table — desktop uniquement (≥ md) */}
            <div className="hidden md:block">
                <Table aria-label="Example table with custom cells">
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid} align={'start'}>
                                {renderCols(column)}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody
                        items={rows}
                        isLoading={isLoading}
                        loadingContent={<Spinner color="primary" label="Chargement des livreurs…" />}
                        emptyContent={isLoading ? ' ' : <EmptyDataTable title="Aucun livreur" />}
                    >
                        {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey) as React.ReactNode}</TableCell>}</TableRow>}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile — cartes tactiles (mêmes données / handlers via renderCell) */}
            <div className="md:hidden space-y-3">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
                    ))
                ) : rows.length === 0 ? (
                    <EmptyDataTable title='Aucun livreur' />
                ) : (
                    rows.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">{renderCell(item, 'nom') as React.ReactNode}</div>
                                <div className="shrink-0">{renderCell(item, 'status') as React.ReactNode}</div>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-400 shrink-0">Matricule</span>
                                <span className="text-sm text-gray-700 text-right truncate">{renderCell(item, 'matricule') as React.ReactNode}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-400 shrink-0">Téléphone</span>
                                <span className="text-sm text-gray-700 text-right truncate">{renderCell(item, 'telephone') as React.ReactNode}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-400 shrink-0">Pièces conformes</span>
                                <span className="text-sm text-gray-700 text-right">{renderCell(item, 'pieces') as React.ReactNode}</span>
                            </div>
                            <div className="pt-2 flex flex-wrap gap-2">{renderCell(item, 'actions') as React.ReactNode}</div>
                        </div>
                    ))
                )}
            </div>
            <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
                <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
                <Pagination total={data?.totalPages ?? 1} page={currentPage} onChange={fetchData} showControls color="primary" variant="bordered" isDisabled={isLoading} />
            </div>
        </div>
    );
}
