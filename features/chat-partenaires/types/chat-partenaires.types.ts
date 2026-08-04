/**
 * Chat STANDARD ↔ partenaires (module Demande de Coursier).
 *
 * Le fil de discussion est rattaché au restaurant (une conversation par
 * partenaire), pas à une course : `courseId` n'est qu'un contexte optionnel
 * porté par certains messages.
 */

/** Qui a écrit le message. SYSTEME = messages automatiques (affichage discret). */
export type EmetteurMessage = 'PARTENAIRE' | 'STANDARD' | 'SYSTEME';

export interface IMessagePartenaire {
  id: string;
  emetteur: EmetteurMessage;
  contenu: string;
  /** Course liée au message, si le message a été émis dans le contexte d'une course. */
  courseId: string | null;
  /** Date (ISO) à laquelle le partenaire a accusé réception d'un message SYSTEME — null sinon. */
  accuseAt: string | null;
  /** Le partenaire a-t-il lu ce message (pertinent pour les messages STANDARD/SYSTEME). */
  luPartenaire: boolean;
  /** Date de création (ISO). Le backend renvoie le fil trié DESC sur cette date. */
  creeLe: string;
}

/** Compteur de messages partenaires non lus côté STANDARD, par restaurant. */
export interface INonLuPartenaire {
  restaurantId: string;
  nonLus: number;
}

export interface IEnvoyerMessageDTO {
  contenu: string;
  courseId?: string;
  /** Id de l'utilisateur ERP émetteur (session), pour la traçabilité. */
  auteurId?: string;
}

export interface IConsignerAppelDTO {
  /** L'appel a-t-il abouti (le partenaire a décroché) ? */
  abouti: boolean;
  dureeSecondes?: number;
  courseId?: string;
  commentaire?: string;
}
