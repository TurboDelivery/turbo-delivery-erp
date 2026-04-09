import { CreneauStatutJour } from '../types/creneau.types';

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

const JOURS_SEMAINE_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

export const getJourLabel = (jour: string): string => {
  const index = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'].indexOf(jour.toUpperCase());
  return index >= 0 ? JOURS_SEMAINE[index] : jour;
};

export const getJourCourtLabel = (jour: string): string => {
  const index = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'].indexOf(jour.toUpperCase());
  return index >= 0 ? JOURS_SEMAINE_COURT[index] : jour;
};

export const getStatutColor = (statut: CreneauStatutJour): string => {
  switch (statut) {
    case CreneauStatutJour.PRESENT:
      return 'text-green-500';
    case CreneauStatutJour.ABSENT:
      return 'text-red-500';
    case CreneauStatutJour.RETARD:
      return 'text-orange-500';
    case CreneauStatutJour.JUSTIFIE:
      return 'text-blue-500';
    case CreneauStatutJour.NON_INSCRIT:
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

export const getStatutDotColor = (statut: CreneauStatutJour): string => {
  switch (statut) {
    case CreneauStatutJour.PRESENT:
      return 'bg-green-500';
    case CreneauStatutJour.ABSENT:
      return 'bg-red-500';
    case CreneauStatutJour.RETARD:
      return 'bg-orange-500';
    case CreneauStatutJour.JUSTIFIE:
      return 'bg-blue-500';
    case CreneauStatutJour.NON_INSCRIT:
      return 'bg-gray-300';
    default:
      return 'bg-gray-300';
  }
};

export const getStatutLabel = (statut: CreneauStatutJour): string => {
  switch (statut) {
    case CreneauStatutJour.PRESENT:
      return 'Present';
    case CreneauStatutJour.ABSENT:
      return 'Absent';
    case CreneauStatutJour.RETARD:
      return 'Retard';
    case CreneauStatutJour.JUSTIFIE:
      return 'Justifie';
    case CreneauStatutJour.NON_INSCRIT:
      return 'Non inscrit';
    default:
      return statut;
  }
};

export const formatSemaineLabel = (debut: string, fin: string): string => {
  const debutDate = new Date(debut);
  const finDate = new Date(fin);
  const mois = debutDate.toLocaleDateString('fr-FR', { month: 'long' });
  const annee = debutDate.getFullYear();
  return `Semaine du ${debutDate.getDate()} au ${finDate.getDate()} ${mois.charAt(0).toUpperCase() + mois.slice(1)} ${annee}`;
};

export const getAssiduiteBgColor = (pourcentage: number): string => {
  if (pourcentage >= 80) return 'bg-green-50 text-green-700';
  if (pourcentage >= 50) return 'bg-orange-50 text-orange-700';
  return 'bg-red-50 text-red-700';
};

export const getAssiduitProgressColor = (pourcentage: number): 'success' | 'warning' | 'danger' => {
  if (pourcentage >= 80) return 'success';
  if (pourcentage >= 50) return 'warning';
  return 'danger';
};
