'use client';

import { Avatar, Card, Chip } from '@heroui-v3/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import React from 'react';

import { LienBouton } from '@/components/commons/LienBouton';
import { Restaurant } from '@/types/models';

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
  const aSuivre = enCours > 0;

  return (
    /*
     * L'avatar du partenaire etait un rond peint dans DIX couleurs de palette tirees au
     * sort sur la premiere lettre du nom : « Pizza Roma » etait violet, « Kfc » bleu.
     * Aucune de ces teintes ne dit quoi que ce soit, et aucune n'a de variante sombre.
     */
    <Card className={`transition-shadow hover:shadow-md ${aSuivre ? 'border-warning/40' : ''}`}>
      <Card.Content className="gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="sm">
            <Avatar.Fallback>{nom.slice(0, 2).toUpperCase()}</Avatar.Fallback>
          </Avatar>
          <p className="truncate text-sm font-semibold text-foreground" title={nom}>
            {nom}
          </p>
          {aSuivre && (
            <span className="ms-auto size-2.5 shrink-0 animate-pulse rounded-full bg-warning" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip color={aSuivre ? 'warning' : 'default'} size="sm" variant="soft">
            <Chip.Label>{enCours} en cours</Chip.Label>
          </Chip>
          <Chip color={terminees > 0 ? 'success' : 'default'} size="sm" variant="soft">
            {terminees > 0 && <CheckCircle2 aria-hidden="true" className="size-3" />}
            <Chip.Label>
              {terminees} terminée{terminees > 1 ? 's' : ''}
            </Chip.Label>
          </Chip>
        </div>

        {/* `as={Link}` etait une prop de la v2, ignoree en silence par le Button v3. */}
        <LienBouton
          className="justify-between"
          href={`/external_delivery/restaurant/${r.restaurantId}`}
          taille="sm"
          variante={aSuivre ? 'outline' : 'ghost'}
        >
          Voir les courses
          <ArrowRight aria-hidden="true" className="size-4" />
        </LienBouton>
      </Card.Content>
    </Card>
  );
};

export default CourseJournaliere;
