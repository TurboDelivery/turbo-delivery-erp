'use client';

import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import { title } from '@/components/primitives';
import { BonLivraison } from '@/types/bon-livraison.model';
import { SelectField } from '@/components/commons/form/select-field';
import { Calendar, Cherry, CircleFadingPlus, Home, SquareMenu, ToggleRight, User } from 'lucide-react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination, RangeValue, CalendarDate, DateRangePicker } from '@heroui/react';
import EmptyDataTable from '@/components/commons/EmptyDataTable';

interface ContentProps {
    initialData: PaginatedResponse<BonLivraison> | null;
    restaurants: Restaurant[]
}

export default function Content({ initialData, restaurants }: ContentProps) {
    const { columns, renderCell, data, handlePageChange, handleDateChange, currentPage, isLoading, handleChangeRestaurant } = useContentCtx({ initialData, restaurants });
    return (
        <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">   
            <div className="flex items-center justify-between">
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>Les tickets</h1>
            </div>
            <div className="w-full bg-white border border-gray-200 shadow-sm rounded-md p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {/* Filtre période */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold font-medium text-gray-700">Rechercher par période</label>
                        <DateRangePicker
                            aria-label="Période"
                            className="w-full"
                            onChange={(value) => handleDateChange(value as RangeValue<CalendarDate>)}
                        />
                    </div>

                    {/* Filtre restaurant */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold font-medium text-gray-700">Sélectionnez un restaurant</label>
                        <SelectField
                            options={restaurants}
                            optionLabel="nomEtablissement"
                            optionValue="nomEtablissement"
                            label="nomEtablissement"
                            setValue={handleChangeRestaurant}
                        />
                    </div>
                </div>
            </div>

            <div className="w-full overflow-x-auto rounded-md border border-gray-200 shadow-sm bg-white">
                <Table
                    aria-label="Table des bons de livraison"
                    classNames={{
                        wrapper: "min-w-full",
                        th: "text-xs sm:text-sm font-bold uppercase tracking-wide text-white bg-red-600 border border-red-700 first:rounded-tl-md last:rounded-tr-md",
                        td: "text-sm text-gray-700 py-1.5 px-3 sm:py-1.5 sm:px-4 truncate border border-gray-200",
                        tr: "hover:bg-red-50 data-[selected=true]:bg-red-100 transition-colors duration-150",
                    }}
                    isHeaderSticky
                    removeWrapper
                    selectionMode="single"
                    color="primary"
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn
                                key={column.uid}
                                align={column.uid === 'actions' ? 'center' : 'start'}
                                className="whitespace-nowrap border border-red-700"
                            >
                                <div className="flex items-center gap-2">
                                    {column.uid === 'reference' ? (
                                        <CircleFadingPlus size={14} />
                                    ) : column.uid === 'date' ? (
                                        <Calendar size={14} />
                                    ) : column.uid === 'livreur' ? (
                                        <User size={14} />
                                    ) : column.uid === 'restaurant' ? (
                                        <Home size={14} />
                                    ) : column.uid === 'coutLivraison' ? (
                                        <Cherry size={14} />
                                    ) : column.uid === 'coutCommande' ? (
                                        <SquareMenu size={14} />
                                    ) : column.uid === 'statut' ? (
                                        <ToggleRight size={14} />
                                    ) : null}
                                    <span>{column.name}</span>
                                </div>
                            </TableColumn>
                        )}
                    </TableHeader>

                    <TableBody
                        items={data?.content ?? []}
                        emptyContent={
                            <EmptyDataTable
                                title="Aucun Bon de Livraison Trouvé"
                                message="Aucune bon de Livraison ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                            />
                        }
                    >
                        {(item) => (
                            <TableRow
                                key={item.commandeId}
                                className="cursor-pointer even:bg-gray-50 hover:bg-red-50 data-[selected=true]:bg-red-100 data-[selected=true]:text-white transition-all duration-100"
                            >
                                {(columnKey) => (
                                    <TableCell className="truncate whitespace-nowrap align-middle max-w-[180px] sm:max-w-[280px] border border-gray-200">
                                        {renderCell(item, columnKey) as React.ReactNode}
                                    </TableCell>
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>


            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 sm:pt-6">
                {/* Info de page (facultatif, mais UX ++ sur mobile) */}
                <span className="text-sm text-gray-600 text-center sm:text-left whitespace-nowrap">
                    Page <span className="font-semibold text-gray-800">{currentPage ?? 1}</span> /{" "}
                    <span className="font-semibold text-gray-800">{data?.totalPages ?? 1}</span>
                </span>


                {/* Pagination principale */}
                <div className="flex justify-center sm:justify-end w-full">
                    <Pagination
                        total={data?.totalPages ?? 1}
                        page={currentPage}
                        onChange={handlePageChange}
                        showControls
                        size="md"
                        color="primary"
                        classNames={{
                            item: "rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:border-red-400 transition-colors duration-150",
                            cursor: "rounded-md bg-red-600 text-white border-red-600 hover:bg-red-700",
                            next: "rounded-md bg-gray-50 hover:bg-gray-100",
                            prev: "rounded-md bg-gray-50 hover:bg-gray-100",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
