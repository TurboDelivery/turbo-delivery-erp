import { PaginatedResponse } from '@/types';

// "Acompte N" est un statut dynamique émis par le serveur (ex. "Acompte 1", "Acompte 2")
export type StatutAcompte = `Acompte ${number}`;

export type StatutFacture =
  | 'DRAFT'              // backend: facture non encore validée
  | 'À valider'           // alias UI
  | 'Validé'
  | 'Recouvrement'
  | 'En cours'           // backend: recouvrement en cours
  | 'Déposé partenaire'
  | 'Preuve ajoutée'     // backend: preuve de dépôt ajoutée
  | StatutAcompte
  | 'Soldé'
  | 'Versé au caissier'
  | 'En attente visa DGA'
  | 'Visé DGA'
  // SPEC-RECOUV-002 — orientation des fonds après visa (DG/DGA).
  | 'Orienté banque'
  | 'Conservé en caisse'
  | 'Rejeté DGA'
  | 'Clôturé';

export type CycleFiltre = 'TOUT' | 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'QUINZAINE' | 'MENSUEL';

export type CycleFacture = 'Journalier' | 'Hebdomadaire' | 'Mensuel';

// ─── Liste ────────────────────────────────────────────────────────────────────

export interface IFactureRF {
  id: string;
  numero: string;
  partenaire: string;
  montant: number;
  montantRecouvre: number | null;
  pourcentageRecouvre: number | null;
  cycle: string;
  emission: string;
  depotPartenaire: { date: string; agent: string } | null;
  depotBanque: string | null;
  agent: string;
  statut: StatutFacture;
  preuve?: string | null; // base64 data URL or HTTP URL returned by the API
  // Visa (SPEC-RECOUV-002 §4.1 / §4.4) — clé du rapprochement visa↔bordereau.
  numeroVisa?: string | null;
  dateVisa?: string | null;
  viseur?: string | null;
}

// ─── Détail ───────────────────────────────────────────────────────────────────

export interface IHistoriqueStatut {
  label: string;
  date?: string | null;
  agent?: string | null;
  montant?: number | null;
  isCurrent?: boolean;
  isPending?: boolean;
}

export interface IFactureRFDetail extends IFactureRF {
  historique: IHistoriqueStatut[];
  // V52 (2026-05) — Preuves uploadées par l'agent recouvreur dans les 2
  // modals d'encaissement et de versement au caissier. Format : data URL
  // base64 (ou null si pas encore fournie). Affichées dans le panel
  // "Preuves & Documents" de facture-detail-view.
  preuveEncaissement?: string | null;
  preuveVersementCaissier?: string | null;
  // SPEC-RECOUV-002 — orientation des fonds + dépôt enrichi (null si non renseignés).
  orientationFonds?: string | null; // DEPOT_BANQUE | CONSERVATION_CAISSE
  orientationMotif?: string | null;
  orientationDate?: string | null;
  numeroVisa?: string | null;
  numeroBordereau?: string | null;
  preuveBordereau?: string | null;
  banqueAgence?: string | null;
  montantDepose?: number | null;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface IFactureRFStats {
  totalFactures: number;
  totalMontant: number;
  nombrePartenaires: number;
  tauxRecouvrement: number;
}

// ─── Agents ───────────────────────────────────────────────────────────────────

// Correspond à ResponsableFinancierAgentVm
export interface IAgentRecouvrement {
  id: string;
  nom: string;
  role: string;
}

// ─── VMs de réponse actions ──────────────────────────────────────────────────

// Correspond à ResponsableFinancierFactureStatutVm
export interface IFactureRFStatutVm {
  id: string;
  statut: StatutFacture;
}

// Correspond à ResponsableFinancierFactureRecouvrementVm
export interface IFactureRFRecouvrementVm {
  id: string;
  statut: StatutFacture;
  agent: string;
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface IFactureRFParams {
  periode?: 'mois' | 'annee' | 'cycle' | 'plage';
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  // Backend ResponsableFinancierFactureResource.listFactures :
  // - cycle : QUOTIDIEN | HEBDOMADAIRE | QUINZAINE | MENSUEL (omis ou 'TOUT' = pas de filtre)
  // - restaurantId : UUID du partenaire
  cycle?: string;
  restaurantId?: string;
  page?: number;
  size?: number;
}

// ─── DTOs (request bodies) ───────────────────────────────────────────────────

// FactureValidationRequestDto
export interface IValiderFactureDTO {
  cycle: CycleFacture;
}

// FactureRecouvrementAssignRequestDto
export interface ILancerRecouvrementDTO {
  agentId: string;
}

// FacturePreuveRequestDto
export interface IAjouterPreuveDTO {
  reference: string;
}

// FactureDepotPartenaireRequestDto
export interface IDepotPartenaireDTO {
  date: string; // ISO date
  agentId: string; // UUID
}

// FactureDepotBanqueRequestDto — SPEC-RECOUV-002 : dépôt enrichi (1 versement =
// 1 bordereau). Activable uniquement sur une facture « Orienté banque ».
export interface IDepotBanqueDTO {
  date: string; // ISO date yyyy-MM-dd ; ≥ date de visa
  numeroBordereau: string; // unique dans tout le système
  preuveBordereau: string; // scan du bordereau (data URL base64)
  banqueAgence: string; // compte créditeur Turbo
  montantDepose: number; // = montant visé de l'opération
}

// FactureRejetDgaRequestDto — 2026-05, motif obligatoire côté backend
// (cf. PATCH /factures/{id}/rejeter-dga + validation @NotBlank).
export interface IRejeterDgaDTO {
  motif: string;
}

// ─── Réponse liste ────────────────────────────────────────────────────────────

// Correspond à ResponsableFinancierFactureListVm
export interface IFactureRFListResponse {
  stats: IFactureRFStats;
  factures: PaginatedResponse<IFactureRF>;
}

