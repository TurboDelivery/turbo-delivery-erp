'use client';

import { Skeleton } from '@heroui/react';
import { AlertTriangle, Bike, CalendarClock, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CarteProps {
  libelle: string;
  valeur: string;
  note: string;
  icone: LucideIcon;
  /** Classes de la pastille d'icône (fond teinté + icône). */
  pastille: string;
  /** Couleur du chiffre. */
  chiffre: string;
  /** Compteur de nouveautés arrivées pendant que l'écran est ouvert. */
  badge?: number;
  isLoading?: boolean;
}

function Carte({ libelle, valeur, note, icone: Icone, pastille, chiffre, badge, isLoading }: CarteProps) {
  return (
    <div className="rounded-2xl border border-default-200/50 bg-white p-4 dark:bg-content1">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${pastille}`}>
          <Icone className="h-5 w-5" />
        </span>
        {!!badge && badge > 0 && (
          <span className="inline-flex animate-pulse items-center rounded-full bg-[#E11D48] px-2 py-0.5 text-[11px] font-bold text-white">
            +{badge}
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="mt-3 h-8 w-16 rounded-md" />
      ) : (
        <p className={`mt-3 text-3xl font-bold leading-none tabular-nums ${chiffre}`}>{valeur}</p>
      )}
      <p className="mt-2 text-[13px] font-semibold text-default-700">{libelle}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-default-400">{note}</p>
    </div>
  );
}

interface Props {
  /** Incidents RECU : personne ne s'en occupe encore. */
  nonPrisEnCharge: number;
  /** Incidents EN_COURS : quelqu'un a la main dessus. */
  enTraitement: number;
  /** Signalements du jour, tous statuts confondus. */
  duJour: number;
  /** Le comptage du jour est plafonné par la page lue (affiche « 50+ »). */
  duJourPlafonne?: boolean;
  /** Livreurs actuellement EN COURSE (bucket `enActivite` du trafic). */
  livreursEnCourse: number;
  /** Livreurs disponibles = présents dans la file du jour. */
  livreursDisponibles: number;
  /** Nombre d'incidents arrivés depuis l'ouverture de l'écran. */
  nouveaux: number;
  isLoading?: boolean;
}

/**
 * Bandeau de tête du poste STANDARD : ce que l'opérateur doit voir en une
 * seconde. Le premier chiffre est le seul qui compte vraiment — un incident que
 * personne n'a pris.
 */
export function StandardKpis({
  nonPrisEnCharge,
  enTraitement,
  duJour,
  duJourPlafonne,
  livreursEnCourse,
  livreursDisponibles,
  nouveaux,
  isLoading,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Carte
        libelle="Non pris en charge"
        valeur={String(nonPrisEnCharge)}
        note="personne ne s'en occupe encore"
        icone={AlertTriangle}
        pastille="bg-[#E11D48]/10 text-[#E11D48]"
        chiffre={nonPrisEnCharge > 0 ? 'text-[#E11D48]' : 'text-default-400'}
        badge={nouveaux}
        isLoading={isLoading}
      />
      <Carte
        libelle="En cours de traitement"
        valeur={String(enTraitement)}
        note="un agent a la main dessus"
        icone={Wrench}
        pastille="bg-[#D97706]/10 text-[#D97706]"
        chiffre={enTraitement > 0 ? 'text-[#D97706]' : 'text-default-400'}
        isLoading={isLoading}
      />
      <Carte
        libelle="Incidents du jour"
        valeur={duJourPlafonne ? `${duJour}+` : String(duJour)}
        note="signalements reçus depuis minuit"
        icone={CalendarClock}
        pastille="bg-primary/10 text-primary"
        chiffre="text-default-700"
        isLoading={isLoading}
      />
      <Carte
        libelle="Livreurs en course"
        valeur={String(livreursEnCourse)}
        note={`${livreursDisponibles} disponible(s) dans la file du jour`}
        icone={Bike}
        pastille="bg-[#1AA05A]/10 text-[#1AA05A]"
        chiffre="text-[#1AA05A]"
        isLoading={isLoading}
      />
    </div>
  );
}
