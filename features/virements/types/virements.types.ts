/**
 * Virements reçus, payeurs et paramètres de règlement.
 *
 * Spécification « Export Rapport Performance (interne / partenaire) » du 05/11/2026,
 * section 7. Ces données n'existaient nulle part : ce sont elles qui permettent au
 * relevé d'annoncer un solde dû à partir de l'argent RÉELLEMENT reçu en banque, et
 * non à partir du « recouvré » porté sur la facture, qui n'a ni date ni preuve.
 */

/** Qui envoie l'argent. Ce n'est pas le partenaire : souvent une entité tierce. */
export interface IPayeur {
  id: string;
  nom: string;
  banque: string | null;
  actif: boolean;
  createdAt: string;
}

/**
 * Pour qui un payeur règle.
 *
 * ⚠ Exactement UNE cible par ligne : un groupe OU un établissement, jamais les deux.
 * Une ligne mixte ferait compter le même virement deux fois dans un relevé de groupe.
 */
export interface IPayeurRattachement {
  id: string;
  payeurId: string;
  groupeId: string | null;
  restaurantId: string | null;
}

/** Un virement bancaire réellement reçu. Le montant est un entier de francs CFA. */
export interface IVirementRecu {
  id: string;
  dateOperation: string;
  dateValeur: string;
  reference: string;
  libelle: string;
  montant: number;
  payeurId: string;
  justificatifUrl: string | null;
  saisiPar: string | null;
  annule: boolean;
  annuleMotif: string | null;
  createdAt: string;
}

export interface ICreerVirement {
  dateOperation: string;
  dateValeur: string;
  reference: string;
  libelle: string;
  montant: number;
  payeurId: string;
  justificatifUrl?: string | null;
}

export interface ICreerPayeur {
  nom: string;
  banque?: string | null;
  groupeIds?: string[];
  restaurantIds?: string[];
}

/**
 * Paramètres de règlement d'un partenaire ou d'un groupe.
 *
 * ⚠ `tauxRetenue` est un POURCENTAGE (2 pour 2 %), strictement inférieur à 100 :
 * la règle du relevé est `prélèvement = virement × taux / (100 - taux)`.
 */
export interface IParametreReglement {
  id: string;
  groupeId: string | null;
  restaurantId: string | null;
  tauxRetenue: number;
  modeReglement: string | null;
  commissionStandard: number | null;
}

export interface IEnregistrerParametre {
  groupeId?: string | null;
  restaurantId?: string | null;
  tauxRetenue: number;
  modeReglement?: string | null;
  commissionStandard?: number | null;
}
