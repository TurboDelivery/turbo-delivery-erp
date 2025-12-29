'use client';

import React from 'react';
import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import { BonLivraison } from '@/types/bon-livraison.model';
import { DateRangePicker, RangeValue, CalendarDate } from '@heroui/react';
import { SelectField } from '@/components/commons/form/select-field';
import EmptyDataTable from '@/components/commons/EmptyDataTable';

interface ContentProps {
    initialData: PaginatedResponse<BonLivraison> | null;
    restaurants: Restaurant[];
}

export default function Content({ initialData, restaurants }: ContentProps) {
    const {
        data,
        columns,
        renderCell,
        handleDateChange,
        handleChangeRestaurant,
        handlePageChange,
        currentPage,
    } = useContentCtx({ initialData, restaurants });

    return (
        <section className="flex-1 flex flex-col">

            {/* Top bar */}
            <header className="h-16 flex items-center justify-between px-6 border-b bg-white">
                <div>
                    <h1 className="text-lg font-semibold">Mes tickets</h1>
                    <p className="text-xs text-gray-400">
                        Système de suivi des tickets de livraison
                    </p>
                </div>

                <button className="px-4 py-2 rounded-full bg-red-500 text-white text-sm">
                    Insérer
                </button>
            </header>

            <div className="p-6 space-y-6">

                {/* Stats cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-[#ffb300] rounded-xl p-4 text-white">
                        <p className="text-xs opacity-80">Revenu Total</p>
                        <p className="text-2xl font-semibold">—</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500">Total Tickets</p>
                        <p className="text-2xl font-semibold">
                            {data?.totalElements ?? 0}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500">Livreurs</p>
                        <p className="text-2xl font-semibold">—</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500">Partenaires</p>
                        <p className="text-2xl font-semibold">—</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4 text-xs">

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <span className="block mb-1 text-gray-500">Filtrer par Restaurant</span>
                            <SelectField
                                options={restaurants}
                                optionLabel="nomEtablissement"
                                optionValue="id"
                                label="nomEtablissement"
                                setValue={handleChangeRestaurant}
                            />
                        </div>

                        <div className="flex-1">
                            <span className="block mb-1 text-gray-500">Filtrer par Date</span>
                            <DateRangePicker
                                aria-label="Période"
                                onChange={(v) =>
                                    handleDateChange(v as RangeValue<CalendarDate>)
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">
                            Total : {data?.totalElements ?? 0} ticket(s)
                        </span>

                        <div className="space-x-2">
                            <button className="px-4 py-1 rounded-full border border-green-500 text-green-600">
                                Enregistrer
                            </button>
                            <button className="px-4 py-1 rounded-full border border-red-400 text-red-500">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                {columns.map(col => (
                                    <th key={col.uid} className="text-left px-4 py-2">
                                        {col.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {!data?.content?.length && (
                                <tr>
                                    <td colSpan={columns.length}>
                                        <EmptyDataTable
                                            title="Aucun Bon de Livraison"
                                            message="Aucun ticket ne correspond à vos critères."
                                        />
                                    </td>
                                </tr>
                            )}

                            {data?.content?.map(item => (
                                <tr
                                    key={item.commandeId}
                                    className="border-t hover:bg-[#ffeec2] transition"
                                >
                                    {columns.map(col => (
                                        <td
                                            key={col.uid}
                                            className="px-4 py-2 whitespace-nowrap"
                                        >
                                            {renderCell(item, col.uid)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex justify-between items-center px-4 py-3 border-t text-xs">
                        <span>
                            Page {currentPage} / {data?.totalPages ?? 1}
                        </span>

                        <div className="space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="px-3 py-1 border rounded-full"
                            >
                                Précédent
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= (data?.totalPages ?? 1)}
                                className="px-3 py-1 border rounded-full"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
