'use client';

import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import { useState, useEffect } from 'react';
import { title } from '@/components/primitives';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { Card, CardBody, CardHeader, Pagination } from "@heroui/react";
import { getPaginationCourseExterneJournaliere } from '@/src/actions/courses.actions';
import CourseJournaliere from '../external_delivery/component/course-journaliere';

interface Props {
    data: PaginatedResponse<Restaurant> | null;
}

export default function Content({ data }: Props) {
    const [pageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [restaurants, setRestaurants] = useState<Restaurant[]>(data?.content ?? []);


    // Refresh auto toutes les 15s
    // useEffect(() => {
    //     const refreshInterval = setInterval(() => {
    //         fetchData(currentPage);
    //     }, 15000);

    //     return () => clearInterval(refreshInterval);
    // }, [currentPage]);

    const fetchData = async (page: number) => {
        setCurrentPage(page);
        try {
            const newData = await getPaginationCourseExterneJournaliere(page - 1, pageSize);
            setRestaurants(newData?.content ?? []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <div className="w-full h-full pb-10">
            <div className="flex items-center justify-between mb-4">
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>Nouvelles courses</h1>
            </div>

            <div>
                {data?.content.length ? (
                    <>
                        <Card className={`w-full bg-white shadow-md rounded-md`}>
                            <CardHeader>
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
                                            onChange={fetchData}
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
                            </CardHeader>
                            <CardBody className="py-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    {restaurants.map((restaurant) => (
                                        <CourseJournaliere key={restaurant.id} restaurant={restaurant} />
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </>
                ) : (
                    <EmptyDataTable
                        title="Aucune Course Trouvée"
                        message="Aucune course ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                    />
                )}
            </div>
        </div>
    );
}
