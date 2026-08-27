'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Chip } from '@heroui/react';
import { ArrowRight, CheckCircle2, Store } from 'lucide-react';
import { Restaurant } from '@/types/models';

const AVATAR_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-green-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-purple-500', 'bg-pink-500',
];

interface CourseJournaliereProps {
  restaurant: Restaurant;
}

/**
 * Carte du point journalier d'un restaurant : courses encore en cours (à suivre)
 * et terminées aujourd'hui, avec accès direct à ses courses.
 */
const CourseJournaliere: React.FC<CourseJournaliereProps> = ({ restaurant: r }) => {
  const enCours = r.coursesEnCours ?? 0;
  const terminees = r.coursesTerminees ?? 0;
  const nom = r.nomRestaurant ?? '—';
  const color = AVATAR_COLORS[(nom.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const aSuivre = enCours > 0;

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3 ${
        aSuivre ? 'border-amber-200' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
          {nom[0]?.toUpperCase() ?? <Store className="w-4 h-4" />}
        </div>
        <p className="font-semibold text-sm text-gray-900 truncate" title={nom}>
          {nom}
        </p>
        {aSuivre && <span className="ml-auto w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Chip size="sm" variant="flat" color={aSuivre ? 'warning' : 'default'}>
          {enCours} en cours
        </Chip>
        <Chip size="sm" variant="flat" color={terminees > 0 ? 'success' : 'default'} startContent={terminees > 0 ? <CheckCircle2 className="w-3 h-3" /> : undefined}>
          {terminees} terminée{terminees > 1 ? 's' : ''}
        </Chip>
      </div>

      <Button
        as={Link}
        href={`/external_delivery/restaurant/${r.restaurantId}`}
        size="sm"
        variant={aSuivre ? 'flat' : 'light'}
        color={aSuivre ? 'primary' : 'default'}
        className="justify-between"
        endContent={<ArrowRight className="w-4 h-4" />}
      >
        Voir les courses
      </Button>
    </div>
  );
};

export default CourseJournaliere;
