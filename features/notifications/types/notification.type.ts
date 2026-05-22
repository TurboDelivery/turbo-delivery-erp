/**
 * Types pour le système de notifications 3-niveaux.
 *
 * - Aligné sur l'enum Java {@code TypeNotification} (cf V44 — main-backend).
 * - Remplace les anciens types/notifcation.model.ts (avec typo) et
 *   types/notification.model.ts (duplicate).
 */

export type NotificationType =
  // Workflows historiques (livraison / paie)
  | 'NOUVELLE_COURSE' | 'ACCEPTATION_COURSE' | 'ASSIGNATION_COURSE' | 'CLOTURE_COURSE'
  | 'COMMANDE' | 'ANNULATION_COMMANDE' | 'NOUVELLE_COMMANDE'
  | 'DEMANDE_ASSIGNATION' | 'DEMANDE_ASSIGNATION_ACCEPTE' | 'DEMANDE_ASSIGNATION_REJETER'
  | 'VALIDATION_PARTIELLE' | 'VALIDATION_COMPLETE'
  | 'RAPPEL' | 'NOUVEAU_LIVREUR' | 'NOUVEAU_RESTAURANT'
  | 'POSITION_LIVREUR' | 'CRENEAU_LIVREUR' | 'CONTESTATION_PAIE'
  | 'POINTAGE_START' | 'POINTAGE_MID' | 'POINTAGE_END'
  // V44 — Workflow tickets contrôle
  | 'TICKET_AUTHENTIFIE' | 'TICKET_V1_VALIDE' | 'TICKET_V2_VALIDE'
  // V44 — Workflow dépenses (charges variables)
  | 'CHARGE_A_VISER_DGA' | 'CHARGE_A_APPROUVER_DG' | 'CHARGE_A_DECAISSER'
  | 'CHARGE_DECAISSEE' | 'CHARGE_REJETEE';

/**
 * Forme retournée par GET /api/erp/notification/{userId}/tous et /non-lu.
 * Backend pré-calcule {@code tempsPasse} ("il y a 5 min") via NotificationUtilitaire.
 */
export interface NotificationVm {
  id: string;
  titre: string;
  message: string;
  lu: boolean;
  lien: string | null;
  type: NotificationType;
  tempsPasse: string;
}

/**
 * Forme retournée par GET /api/erp/notification/{notificationId}.
 * Inclut les timestamps bruts pour usage avancé (filtres date).
 */
export interface NotificationDetailsVm extends NotificationVm {
  utilisateurId: string;
  createdAt: string;
  updatedAt: string;
}

/** Body de PUT /api/erp/notification pour marquer une notif lue. */
export interface LireNotificationCommande {
  utilisateurId: string;
  notificationId: string;
}

/** Réponse de PUT /api/erp/notification/{userId}/tous-lus. */
export interface MarkAllAsReadResponse {
  updated: number;
}

/** Réponse de GET /api/erp/notification/{userId}/count-non-lu. */
export interface UnreadCountResponse {
  count: number;
}
