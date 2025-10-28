'use client';

import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import { title } from '@/components/primitives';
import { BonLivraison } from '@/types/bon-livraison.model';
import { SelectField } from '@/components/commons/form/select-field';
import { Calendar, Cherry, CircleFadingPlus, Home, SquareMenu, ToggleRight, User } from 'lucide-react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination, RangeValue, CalendarDate, DateRangePicker } from '@heroui/react';

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
            <div className='grid grid-cols-4 gap-4'>
                <div className="flex flex-col gap-2 ">
                    <span>Rechercher par période</span>
                    {/* Utilise le DatePicker avec l'événement onChange */}
                    <DateRangePicker
                        className="max-w-[284px]"
                        onChange={(value) => handleDateChange(value as RangeValue<CalendarDate>)}
                    />
                </div>
                <div className='flex flex-col gap-2'>
                    <span>Selectionnez un restaurant :</span>
                    <SelectField options={restaurants} optionLabel={"nomEtablissement"} optionValue={'nomEtablissement'} label='nomEtablissement'
                        setValue={handleChangeRestaurant} />
                </div>
            </div>

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
                <TableBody items={data?.content ?? []} emptyContent={'No rows to display.'}>
                    {(item) => <TableRow key={item.commandeId}>{(columnKey) => <TableCell>{renderCell(item, columnKey) as React.ReactNode}</TableCell>}</TableRow>}
                </TableBody>
            </Table>
            <div className="flex justify-center pt-4 sm:pt-6">
                <Pagination
                    total={data?.totalPages ?? 1}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                />
            </div>
        </div>
    );
}
