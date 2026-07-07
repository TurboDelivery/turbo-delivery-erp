// Module M7 — STANDARD (incidents & appels), CDC v1.5 RG-22/23/24.
// Miroir des VMs backend (main-backend) servies sous /api/erp/incident et /api/erp/appel.

export type StatutIncident = 'RECU' | 'EN_COURS' | 'TRAITE' | 'CLOTURE';

export type ActeurAppel = 'LIVREUR' | 'STANDARD';

export type ContexteAppel = 'LIVREUR_VERS_STANDARD' | 'STANDARD_VERS_LIVREUR' | 'PAIR_VERS_PAIR';

/** Incident signalé par un livreur (IncidentVm). */
export interface IIncident {
  id: string;
  livreurId: string;
  livreurNom: string | null;
  motifCode: string;
  motifLibelle: string;
  description: string | null;
  preuveUrl: string | null;
  preuveType: string | null; // PHOTO | VIDEO | FICHIER
  latitude: number | null;
  longitude: number | null;
  statut: StatutIncident;
  traitePar: string | null;
  commentaireTraitement: string | null;
  signaleLe: string; // ISO instant
}

/** Motif d'incident paramétrable (IncidentMotifVm). */
export interface IIncidentMotif {
  code: string;
  libelle: string;
  ordre: number | null;
  icone: string | null;
  actif: boolean;
}

/** Appel journalisé (AppelLogVm). */
export interface IAppelLog {
  id: string;
  appelantId: string;
  appelantType: ActeurAppel;
  appeleId: string | null;
  appeleType: ActeurAppel;
  appeleTelephone: string | null;
  contexte: ContexteAppel;
  incidentId: string | null;
  declencheLe: string; // ISO instant
}

export interface IChangerStatutIncident {
  statut: StatutIncident;
  commentaire?: string;
}

export interface ICreerMotifIncident {
  code: string;
  libelle: string;
  ordre?: number;
  icone?: string;
}

export interface IModifierMotifIncident {
  libelle?: string;
  ordre?: number;
  actif?: boolean;
  icone?: string;
}

/** Ordre d'avancement (pour interdire les retours arrière côté UI, comme le backend). */
export const STATUT_ORDRE: Record<StatutIncident, number> = {
  RECU: 0,
  EN_COURS: 1,
  TRAITE: 2,
  CLOTURE: 3,
};

export const STATUT_LABEL: Record<StatutIncident, string> = {
  RECU: 'Reçu',
  EN_COURS: 'En cours',
  TRAITE: 'Traité',
  CLOTURE: 'Clôturé',
};

// ─── Appel audio in-app (LUNION Meet) ─────────────────────────────────────────

export type StatutAppel = 'INITIE' | 'SONNE' | 'EN_COURS' | 'TERMINE' | 'REJETE' | 'MANQUE' | 'ANNULE';

/** Corps d'initiation d'un appel (InitierAppelDto backend). */
export interface IInitierAppel {
  appelantId: string;
  appelantType: ActeurAppel;
  appeleId?: string | null;
  appeleType: ActeurAppel;
  contexte: ContexteAppel;
  incidentId?: string | null;
  appeleTelephone?: string | null;
}

/** Acceptation d'un appel entrant (AccepterAppelDto backend). */
export interface IAccepterAppel {
  appeleId: string;
  appeleNom?: string;
}

/** Session d'appel LUNION à rejoindre (AppelSessionVm backend) — token + url pour le SDK. */
export interface IAppelSession {
  appelId: string;
  roomSlug: string;
  token: string;
  url: string;
  statut: StatutAppel;
  contexte: ContexteAppel;
  appelantNom: string;
  appeleNom: string;
}

/** Appel entrant SONNE vers STANDARD (AppelEntrantVm backend) — repli de signalisation pollé. */
export interface IAppelEntrant {
  appelId: string;
  appelantNom: string;
  contexte: ContexteAppel;
  declencheLe: string;
}

/**
 * Configuration du groupe de réponse (AppelConfigVm backend) : clés de rôle
 * frontend (AppRole) dont les utilisateurs « sonnent » sur un appel livreur → STANDARD.
 */
export interface IAppelConfig {
  rolesRepondants: string[];
}
