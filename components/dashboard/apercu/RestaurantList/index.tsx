'use client';

import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/react";
import { subtitle } from '@/components/primitives';
import { Calendar, Cherry, CircleFadingPlus, Home, SquareMenu, ToggleRight, User } from 'lucide-react';
import useRestaurantListCtx from './useRestaurantListCtx';
import { ChiffreAffaireRestaurant } from '@/types/statistiques.model';

interface ContentProps {
    data: ChiffreAffaireRestaurant[];
}

export default function RestaurantList({ data }: ContentProps) {
    const { columns, renderCell } = useRestaurantListCtx();

    return (
        <div className="h-full pb-10 flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className={subtitle({class: 'font-semibold' })}>Chiffre d&apos;affaire par restaurant</h1>
            </div>

            {/* Tableau (desktop ≥ md) */}
            <div className="hidden md:block">
                <Table aria-label="Example table with custom cells">
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                                <div className="flex gap-2 text-primary">
                                    {column.uid === 'reference' ? (
                                        <CircleFadingPlus size={15} />
                                    ) : column.uid === 'date' ? (
                                        <Calendar size={15} />
                                    ) : column.uid === 'livreur' ? (
                                        <User size={15} />
                                    ) : column.uid === 'restaurant' ? (
                                        <Home size={15} />
                                    ) : column.uid === 'coutLivraison' ? (
                                        <Cherry size={15} />
                                    ) : column.uid === 'coutCommande' ? (
                                        <SquareMenu size={15} />
                                    ) : column.uid === 'statut' ? (
                                        <ToggleRight size={15} />
                                    ) : (
                                        <></>
                                    )}
                                    {column.name}
                                </div>
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody items={data ?? []} emptyContent={'No rows to display.'}>
                        {(item) => <TableRow key={item.restaurantId}>{(columnKey) => <TableCell>{renderCell(item, columnKey as keyof ChiffreAffaireRestaurant) as React.ReactNode}</TableCell>}</TableRow>}
                    </TableBody>
                </Table>
            </div>

            {/* Cartes (mobile < md) — mêmes données et mêmes cellules (renderCell) que le tableau */}
            <div className="md:hidden space-y-3">
                {(data ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No rows to display.</p>
                ) : (
                    (data ?? []).map((item) => (
                        <div key={item.restaurantId} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.restaurant}</p>
                            {columns
                                .filter((col) => col.uid !== 'restaurant')
                                .map((col) => (
                                    <div key={col.uid} className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-gray-400 shrink-0">{col.name}</span>
                                        <span className="text-sm text-gray-700 text-right">
                                            {renderCell(item, col.uid as keyof ChiffreAffaireRestaurant) as React.ReactNode}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
