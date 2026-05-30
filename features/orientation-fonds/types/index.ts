// SPEC-RECOUV-002 — Orientation des fonds après visa + vérification des dépôts.

export type OrientationFonds = 'DEPOT_BANQUE' | 'CONSERVATION_CAISSE';

// FactureOrientationRequestDto
export interface IOrientationDTO {
  orientation: OrientationFonds;
  motif?: string; // obligatoire (≥30c) si CONSERVATION_CAISSE
}

// FactureReorientationRequestDto
export interface IReorientationDTO {
  motif: string; // ≥30c
}

// AttestationCaisseRequestDto
export interface IAttestationCaisseDTO {
  montantComptePhysique: number;
  commentaire?: string;
}

// AttestationCaisseVm
export interface IAttestationCaisseVm {
  id: string;
  dateAttestation: string;
  montantComptePhysique: number;
  soldeTheorique: number;
  ecart: number;
  caissier: string;
  commentaire: string | null;
}

// VerificationDepotsVm.LigneBanque
export type EtatRapprochement =
  | 'CONCORDANT'
  | 'BORDEREAU_MANQUANT'
  | 'PREUVE_MANQUANTE'
  | 'ECART_MONTANT';

export interface ILigneBanque {
  factureId: string;
  numero: string;
  partenaire: string;
  numeroVisa: string | null;
  numeroBordereau: string | null;
  montantVise: number;
  montantDepose: number;
  dateDepot: string | null;
  preuvePresente: boolean;
  banqueAgence: string | null;
  etatRapprochement: EtatRapprochement;
}

// VerificationDepotsVm.LigneCaisse
export type EtatCaisse = 'EN_CAISSE' | 'REORIENTE_BANQUE' | 'REGULARISE';

export interface ILigneCaisse {
  factureId: string;
  numero: string;
  partenaire: string;
  numeroVisa: string | null;
  montantConserve: number;
  motif: string | null;
  ancienneteJours: number;
  alerteDormant: boolean;
  etat: EtatCaisse;
}

// VerificationDepotsVm.Synthese
export interface ISyntheseBouclage {
  totalVise: number;
  totalDepose: number;
  totalConserve: number;
  ecartBouclage: number;
  bouclageOk: boolean;
  nbAnomaliesBanque: number;
  nbConservations: number;
}

// VerificationDepotsVm
export interface IVerificationDepots {
  orientesBanque: ILigneBanque[];
  conservesCaisse: ILigneCaisse[];
  synthese: ISyntheseBouclage;
}

export interface IStatutVm {
  id: string;
  statut: string;
}
