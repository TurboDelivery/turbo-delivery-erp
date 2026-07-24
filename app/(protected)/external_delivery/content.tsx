'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Avatar, Button, Chip, Pagination, Skeleton } from '@heroui/react';
import { Clock, Eye, MapPin, Package, Phone, UserRoundPlus } from 'lucide-react';

import { PaginatedResponse } from '@/types';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { getPaginationCourseExterneEnAttente } from '@/src/actions/courses.actions';
import { createUrlFile } from '@/utils/createUrlFile';
import { useAbility } from '@/hooks/use-ability';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import DeliveryTools from './component/deliveryTools';
import DeliveryAssign from './component/delivery-assign';
import { COURSE_STATUT_ACCENTS, CourseStatutChip, fmtXof, montantCourse } from './component/course-statut';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `il y a ${h} h ${diffMin % 60 ? `${diffMin % 60} min` : ''}`.trim();
  return dayjs(iso).format('DD/MM à HH:mm');
}

// ─── Carte d'une course ────────────────────────────────────────────────────────
function CourseCard({ course, delivers, canUpdate }: { course: CourseExterne; delivers: LivreurDisponible[]; canUpdate: boolean }) {
  const [openAssign, setOpenAssign] = useState(false);
  const premiere = course.commandes?.[0];
  const enAttente = course.statut?.toUpperCase() === 'EN_ATTENTE';
  const accent = COURSE_STATUT_ACCENTS[course.statut?.toUpperCase() ?? ''] ?? 'border-l-gray-200';

  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-l-4 ${accent} shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3`}>
      {/* Header : partenaire + montant */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={course.restaurant?.logo ? createUrlFile(course.restaurant.logo, 'restaurant') : undefined}
            name={course.restaurant?.nomEtablissement?.[0] ?? '?'}
            size="md"
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{course.restaurant?.nomEtablissement ?? '—'}</p>
            <p className="text-xs text-gray-500 truncate">{course.restaurant?.commune ?? ''}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="bg-gray-900 text-white text-sm font-semibold rounded-lg px-2.5 py-1">
            {fmtXof(montantCourse(course.commandes))}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock className="w-3 h-3" />
            {timeAgo(course.createdAt)}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        <span className="font-mono font-semibold text-gray-800">{course.code}</span>
        <span className="flex items-center gap-1">
          <Package className="w-3.5 h-3.5 text-gray-400" />
          {course.nombreCommande ?? course.commandes?.length ?? 0} commande{(course.nombreCommande ?? 0) > 1 ? 's' : ''}
        </span>
        {premiere?.destinataire?.nomComplet && (
          <span className="flex items-center gap-1 truncate max-w-[220px]">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            {premiere.destinataire.nomComplet}
          </span>
        )}
        {premiere?.zone && (
          <span className="flex items-center gap-1 truncate max-w-[220px]">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            {premiere.zone}
          </span>
        )}
      </div>

      {/* Footer : statut + actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
        <CourseStatutChip statut={course.statut} />
        <div className="flex items-center gap-1.5">
          {enAttente && canUpdate && (
            <Button size="sm" color="primary" startContent={<UserRoundPlus className="w-4 h-4" />} onPress={() => setOpenAssign(true)}>
              Assigner
            </Button>
          )}
          <Button size="sm" variant="bordered" startContent={<Eye className="w-4 h-4" />} as={Link} href={`/external_delivery/${course.id}`}>
            Détail
          </Button>
          <DeliveryTools delivery={course} delivers={delivers} />
        </div>
      </div>

      <DeliveryAssign delivery={course} delivers={delivers} open={openAssign} setOpen={setOpenAssign} />
    </div>
  );
}

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
