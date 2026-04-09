import { CreneauStatutJour } from '../types/creneau.types';

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
