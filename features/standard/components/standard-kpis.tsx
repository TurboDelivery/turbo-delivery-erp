'use client';

import { AlertTriangle, Bike, CalendarClock, Wrench } from 'lucide-react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';

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
    <GrilleStats colonnes={4}>
      <CarteStat
        libelle="Non pris en charge"
        valeur={nonPrisEnCharge}
        note="personne ne s'en occupe encore"
        icone={AlertTriangle}
        // Le rouge ne se declenche qu'a partir d'un incident : zero non pris en
        // charge est une bonne nouvelle, la carte ne doit pas alerter pour rien.
        ton={nonPrisEnCharge > 0 ? 'danger' : 'neutre'}
        badge={nouveaux}
        isLoading={isLoading}
      />
      <CarteStat
        libelle="En cours de traitement"
        valeur={enTraitement}
        note="un agent a la main dessus"
        icone={Wrench}
        // Meme regle que la carte precedente : pas de couleur sans matiere.
        ton={enTraitement > 0 ? 'attention' : 'neutre'}
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Incidents du jour"
        valeur={duJourPlafonne ? `${duJour}+` : duJour}
        note="signalements reçus depuis minuit"
        icone={CalendarClock}
        ton="primaire"
        isLoading={isLoading}
      />
      <CarteStat
        libelle="Livreurs en course"
        valeur={livreursEnCourse}
        note={`${livreursDisponibles} disponible(s) dans la file du jour`}
        icone={Bike}
        ton="succes"
        isLoading={isLoading}
      />
    </GrilleStats>
  );
}
