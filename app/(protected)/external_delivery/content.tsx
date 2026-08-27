'use client';

import { useState, useEffect, useRef } from 'react';
import { Chip, Pagination, Skeleton } from '@/components/heroui';

import { PaginatedResponse } from '@/types';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { getPaginationCourseExterneEnAttente } from '@/src/actions/courses.actions';
import { useAbility } from '@/hooks/use-ability';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import CourseCard from './component/course-card';

// ─── Page ──────────────────────────────────────────────────────────────────────
interface Props {
  initialData: PaginatedResponse<CourseExterne> | null;
  delivers: LivreurDisponible[];
}

export default function Content({ initialData, delivers }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState<PaginatedResponse<CourseExterne> | null>(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const ability = useAbility();
  const canUpdate = ability.can('update', 'Commande');

  const courses = data?.content ?? [];

  // 🔊 Alerte sonore tant qu'il y a des courses en attente (dispatch)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [canPlayAudio, setCanPlayAudio] = useState(false);

  useEffect(() => {
    const unlockAudio = () => {
      setCanPlayAudio(true);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!canPlayAudio || !audioRef.current) return;
    if (courses.length > 0) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {
        alert('🔴 Nouvelle course 🔴 — cliquez sur OK pour activer la sonnerie.');
        audioRef.current?.play();
      });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [courses.length, canPlayAudio]);

  // Rafraîchissement silencieux toutes les 15 s
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const newData = await getPaginationCourseExterneEnAttente(currentPage - 1, pageSize);
        setData(newData);
      } catch {
        /* silencieux */
      }
    }, 15000);
    return () => clearInterval(refreshInterval);
  }, [currentPage, pageSize]);

  const fetchData = async (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    try {
      const newData = await getPaginationCourseExterneEnAttente(page - 1, pageSize);
      setData(newData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full pb-10 flex flex-col gap-5">
      <audio ref={audioRef} src="/assets/sounds/notification.wav" preload="auto" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Nouvelles courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Courses envoyées par les partenaires via l&apos;intégration — à dispatcher aux livreurs.
          </p>
        </div>
        <Chip color={courses.length > 0 ? 'warning' : 'default'} variant="flat">
          {data?.totalElements ?? 0} en attente
        </Chip>
      </div>

      {/* Cartes */}
      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="rounded-xl h-44" />
          ))}
        </div>
      ) : courses.length ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} delivers={delivers} canUpdate={canUpdate} />
          ))}
        </div>
      ) : (
        <EmptyDataTable
          title="Aucune course en attente"
          message="Les nouvelles courses envoyées par les partenaires apparaîtront ici en temps réel."
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
