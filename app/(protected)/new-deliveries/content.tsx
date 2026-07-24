'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Chip, Pagination, Skeleton } from '@heroui/react';

import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { getPaginationCourseExterneJournaliere } from '@/src/actions/courses.actions';
import CourseJournaliere from '../external_delivery/component/course-journaliere';

interface Props {
  data: PaginatedResponse<Restaurant> | null;
}

/**
 * Point du jour, restaurant par restaurant : combien de courses sont encore en
 * cours et combien sont terminées. Rafraîchi automatiquement toutes les 30 s.
 */
export default function Content({ data: initialData }: Props) {
  const [pageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<Restaurant> | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const restaurants = data?.content ?? [];
  const totalEnCours = useMemo(
    () => restaurants.reduce((s, r) => s + (r.coursesEnCours ?? 0), 0),
    [restaurants],
  );

  const fetchData = async (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    try {
      const newData = await getPaginationCourseExterneJournaliere(page - 1, pageSize);
      setData(newData);
    } finally {
      setIsLoading(false);
    }
  };

  // Rafraîchissement silencieux toutes les 30 s (supervision du jour).
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const newData = await getPaginationCourseExterneJournaliere(currentPage - 1, pageSize);
        setData(newData);
      } catch {
        /* silencieux */
      }
    }, 30000);
    return () => clearInterval(id);
  }, [currentPage, pageSize]);

  return (
    <div className="w-full h-full pb-10 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary">Courses journalières</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {dayjs().format('dddd DD/MM/YYYY')} — point par restaurant partenaire
          </p>
        </div>
        <Chip color={totalEnCours > 0 ? 'warning' : 'success'} variant="flat">
          {totalEnCours > 0 ? `${totalEnCours} course${totalEnCours > 1 ? 's' : ''} à suivre` : 'Tout est à jour'}
        </Chip>
      </div>

      {/* Grille des restaurants */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="rounded-xl h-36" />
          ))}
        </div>
      ) : restaurants.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {restaurants.map((restaurant) => (
            <CourseJournaliere key={restaurant.restaurantId} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <EmptyDataTable
          title="Aucune course aujourd'hui"
          message="Les restaurants ayant émis des courses aujourd'hui apparaîtront ici avec leur point en cours / terminées."
        />
      )}

      {/* Pagination */}
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-center mt-2 w-full">
          <Pagination
            total={data?.totalPages ?? 1}
            page={currentPage}
            onChange={fetchData}
            showControls
            color="primary"
            variant="bordered"
            isDisabled={isLoading}
          />
        </div>
      )}
    </div>
  );
}
