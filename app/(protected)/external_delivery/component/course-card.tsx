'use client';

import { useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Avatar, Button, Card } from '@heroui-v3/react';

import { LienBouton } from '@/components/commons/LienBouton';
import { Clock, Eye, MapPin, Package, Phone, UserRoundPlus } from 'lucide-react';

import { CourseExterne, LivreurDisponible } from '@/types/models';
import { createUrlFile } from '@/utils/createUrlFile';
import DeliveryTools from './deliveryTools';
import DeliveryAssign from './delivery-assign';
import { COURSE_STATUT_ACCENTS, CourseStatutChip, fmtXof, montantCourse } from './course-statut';

export function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `il y a ${h} h ${diffMin % 60 ? `${diffMin % 60} min` : ''}`.trim();
  return dayjs(iso).format('DD/MM à HH:mm');
}

/**
 * Carte d'une course externe (canal intégration) — partagée entre « Nouvelles
 * courses », « Toutes les courses » et les vues par restaurant.
 */
export default function CourseCard({
  course,
  delivers,
  canUpdate,
}: {
  course: CourseExterne;
  delivers: LivreurDisponible[];
  canUpdate: boolean;
}) {
  const [openAssign, setOpenAssign] = useState(false);
  const premiere = course.commandes?.[0];
  const enAttente = course.statut?.toUpperCase() === 'EN_ATTENTE';
  const accent = COURSE_STATUT_ACCENTS[course.statut?.toUpperCase() ?? ''] ?? 'border-l-separator';

  return (
    <Card className={`border-l-4 ${accent} transition-shadow hover:shadow-md`}>
      <Card.Content className="gap-3 p-5">
      {/* Header : partenaire + montant */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar size="md">
            <Avatar.Image
              alt=""
              src={
                course.restaurant?.logo
                  ? createUrlFile(course.restaurant.logo, 'restaurant')
                  : undefined
              }
            />
            <Avatar.Fallback>
              {(course.restaurant?.nomEtablissement ?? '?').slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{course.restaurant?.nomEtablissement ?? '—'}</p>
            <p className="text-xs text-muted truncate">{course.restaurant?.commune ?? ''}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="bg-foreground text-background text-sm font-semibold rounded-lg px-2.5 py-1">
            {fmtXof(montantCourse(course.commandes))}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Clock className="w-3 h-3" />
            {timeAgo(course.createdAt)}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="font-mono font-semibold text-foreground">{course.code}</span>
        <span className="flex items-center gap-1">
          <Package className="w-3.5 h-3.5 text-muted" />
          {course.nombreCommande ?? course.commandes?.length ?? 0} commande{(course.nombreCommande ?? 0) > 1 ? 's' : ''}
        </span>
        {premiere?.destinataire?.nomComplet && (
          <span className="flex items-center gap-1 truncate max-w-[220px]">
            <Phone className="w-3.5 h-3.5 text-muted" />
            {premiere.destinataire.nomComplet}
          </span>
        )}
        {premiere?.zone && (
          <span className="flex items-center gap-1 truncate max-w-[220px]">
            <MapPin className="w-3.5 h-3.5 text-muted" />
            {premiere.zone}
          </span>
        )}
      </div>

      {/* Footer : statut + actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-separator">
        <CourseStatutChip statut={course.statut} />
        <div className="flex items-center gap-1.5">
          {enAttente && canUpdate && (
            <Button onPress={() => setOpenAssign(true)} size="sm" variant="primary">
              <UserRoundPlus aria-hidden="true" className="size-4" />
              Assigner
            </Button>
          )}
          {/* `as={Link}` etait une prop de la v2, ignoree en silence par le Button v3. */}
          <LienBouton href={`/external_delivery/${course.id}`} taille="sm" variante="outline">
            <Eye aria-hidden="true" className="size-4" />
            Détail
          </LienBouton>
          <DeliveryTools delivery={course} delivers={delivers} />
        </div>
      </div>

      <DeliveryAssign delivery={course} delivers={delivers} open={openAssign} setOpen={setOpenAssign} />
      </Card.Content>
    </Card>
  );
}
