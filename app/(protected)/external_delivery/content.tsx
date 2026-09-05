'use client';

import { useState, useEffect, useRef } from 'react';
import { Chip } from '@heroui-v3/react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';

import { PaginatedResponse } from '@/types';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { getPaginationCourseExterneEnAttente } from '@/src/actions/courses.actions';
import { useAbility } from '@/hooks/use-ability';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import EtatErreur from '@/components/commons/EtatErreur';
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
  // `getPaginationCourseExterneEnAttente` avale l'erreur et rend `null` : une page
  // absente est donc TOUJOURS une lecture qui a echoue, jamais une page vide.
  // Sans ce drapeau, le dispatch lisait "Aucune course en attente" et concluait
  // qu'il n'avait personne a affecter.
  const [erreurLecture, setErreurLecture] = useState(!initialData);
  // Le squelette n'a plus a couvrir le cas `initialData` absent : c'est l'etat
  // d'erreur qui le prend, avec un bouton pour relancer la lecture.
  const [isLoading, setIsLoading] = useState(false);
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
        setErreurLecture(!newData);
      } catch {
        setErreurLecture(true);
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
      setErreurLecture(!newData);
    } catch {
      setErreurLecture(true);
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
          <p className="text-sm text-muted mt-0.5">
            Courses envoyées par les partenaires via l&apos;intégration — à dispatcher aux livreurs.
          </p>
        </div>
        {/* Le compteur se tait en cas d'echec : "0 en attente" est la meme
            phrase que celle affichee quand il n'y a vraiment rien a dispatcher. */}
        {!(erreurLecture && courses.length === 0) && (
          /* Des courses en attente de dispatch, c'est un travail qui attend : l'ambre
              dit ici quelque chose. */
          <Chip color={courses.length > 0 ? 'warning' : 'default'} size="sm" variant="soft">
            <Chip.Label>{data?.totalElements ?? 0} en attente</Chip.Label>
          </Chip>
        )}
      </div>

      {/* Cartes */}
      {erreurLecture && courses.length === 0 ? (
        // A la place du message de vide : "Aucune course en attente" est ce
        // qu'on affiche quand il n'y a REELLEMENT rien a dispatcher.
        <EtatErreur
          quoi="les courses en attente"
          onReessayer={() => fetchData(currentPage)}
          enCours={isLoading}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <div className="h-44 animate-pulse rounded-xl bg-surface-secondary" key={index} />
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
          <PaginationTableau onPage={fetchData} page={currentPage} total={data?.totalPages ?? 1} />
        </div>
      )}
    </div>
  );
}
