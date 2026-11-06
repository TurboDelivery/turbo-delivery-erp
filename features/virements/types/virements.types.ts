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

/**
 * Le volet « argent reçu » d'une sélection, tel que le relevé de compte le calcule.
 *
 * <p>C'est la même source que les deux PDF du relevé : l'écran et l'export disent donc
 * le même franc, par construction. Les faire calculer séparément est exactement ce qui
 * fait qu'un export contredit l'écran qui l'a lancé.</p>
 */
export interface IReleveReglement {
  /** Frais de livraison + commission sur les tickets facturables de la période. */
  montantFacture: number;
  /** La somme des virements BANCAIRES de la période, hors annulés. */
  montantRegle: number;
  /** La retenue : `virement × taux / (100 − taux)`, arrondie virement par virement. */
  prelevement: number;
  /** `montantRegle + prelevement` : ce que les virements couvrent réellement. */
  montantCouvert: number;
  /** `montantFacture − montantCouvert`. Positif, il reste dû. */
  gap: number;
  tauxApplique: number | null;
  /**
   * ⚠ Vrai quand la sélection n'a AUCUN payeur rattaché.
   *
   * <p>Le montant réglé vaut alors zéro — mais ce zéro ne veut pas dire « rien n'a été
   * payé », il veut dire « on ne sait pas qui paie ». L'écran doit afficher un tiret et
   * la raison, jamais « 0 FCFA », qui se lirait comme une mesure.</p>
   */
  aucunPayeurRattache: boolean;
  /**
   * Vrai quand un payeur de la sélection règle AUSSI des établissements hors sélection :
   * le montant réglé ne peut pas être attribué à cette seule sélection sans ventilation.
   */
  payeurDeborde: boolean;
  nombreEtablissements: number;
}

export interface IReleveParams {
  groupeId?: string;
  restaurantIds?: string[];
  debut: Date;
  fin: Date;
}
