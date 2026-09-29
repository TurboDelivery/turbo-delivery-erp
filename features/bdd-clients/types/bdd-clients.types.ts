/** L'état d'une ligne, tel que le serveur le rend. */
export type EtatLigne = 'NOUVEAU' | 'CONNU' | 'BLOQUE';

/** Une ligne envoyée au contrôle groupé. */
export interface ILigneAVerifier {
  index: number;
  contact: string;
  numCheck?: string | null;
}

/**
 * Le verdict d'une ligne.
 *
 * `nbCaptures` compte les captures du contact tous partenaires confondus ;
 * `dejaChezCePartenaire` distingue un client partagé d'un fidèle maison.
 */
export interface IVerdictLigne {
  index: number;
  etat: EtatLigne;
  telephoneE164: string | null;
  motif: string | null;
  clientId: string | null;
  nbCaptures: number;
  dejaChezCePartenaire: boolean;
}

/** Une ligne de la grille de saisie. */
export interface ILigneSaisie {
  index: number;
  contact: string;
  nom?: string | null;
  prenom?: string | null;
  zoneSaisie?: string | null;
  zoneId?: string | null;
  numCheck?: string | null;
  numCommande?: string | null;
  montant?: number | null;
  articles?: string | null;
  dateCommande?: string | null;
}

export interface IEnregistrerLot {
  lotId?: string | null;
  partenaireId: string;
  dateReference: string;
  lignes: ILigneSaisie[];
  valider: boolean;
  /**
   * Un même numéro peut-il revenir dans ce lot.
   *
   * <p>Faux à la saisie : deux fois le même numéro sur cinquante lignes tapées est
   * presque toujours une double frappe, et le refus protège l'agent. Vrai à l'import :
   * un numéro qui revient dans l'historique d'un restaurant est un client fidèle, et
   * chacune de ses lignes est une commande réelle. Arbitrage posé le 29/09/2026.</p>
   *
   * <p>⚠ Cela ne lève PAS l'unicité du numéro de check, qui protège un index et non une
   * règle de gestion.</p>
   */
  repetitionsAutorisees?: boolean;
}

/**
 * Ce que l'écran affiche après un enregistrement.
 *
 * Les trois premiers nombres se recoupent volontairement
 * (`nbEnregistrees === nbNouveaux + nbRattachees`) : c'est ce qui permet de vérifier
 * d'un coup d'œil que rien n'a été perdu.
 */
export interface ISyntheseLot {
  lotId: string;
  statut: 'BROUILLON' | 'VALIDE';
  nbEnregistrees: number;
  nbNouveaux: number;
  nbRattachees: number;
  nbErreurs: number;
  erreurs: IVerdictLigne[];
}

export interface ILotResume {
  id: string;
  partenaireId: string;
  dateReference: string;
  statut: 'BROUILLON' | 'VALIDE';
  nbLignesPrevues: number;
  nbEnregistrees: number;
  nbErreurs: number;
  createdAt: string;
  validatedAt: string | null;
  /** Brouillon de plus de 48 h. Le seuil est un paramètre du module, calculé serveur. */
  enRetard: boolean;
}

export interface ILigneLot {
  index: number;
  contact: string;
  nom: string | null;
  prenom: string | null;
  zoneSaisie: string | null;
  zoneId: string | null;
  numCheck: string | null;
  numCommande: string | null;
  montant: number | null;
  dateCommande: string | null;
}

export interface ILotDetail {
  entete: ILotResume;
  lignes: ILigneLot[];
}

/** Une ligne de la base consolidée : un client, jamais une commande. */
export interface ILigneClient {
  id: string;
  /** Le combien-ième contact capturé. Calculé, pas le rang de séquence. */
  position: number;
  /** Déjà masqué par le serveur, sauf demande explicite d'un profil autorisé. */
  telephone: string;
  nom: string | null;
  prenom: string | null;
  alias: string[];
  zonePrincipaleId: string | null;
  statut: string;
  segment: string | null;
  consentement: string | null;
  nbCaptures: number;
  nbPartenaires: number;
  montantCumule: number;
  premiereCaptureAt: string | null;
  derniereCaptureAt: string | null;
  partenairePrincipalId: string | null;
}

export interface IKpisBase {
  clientsUniques: number;
  nouveauxClients: number;
  clientsMultiRestaurants: number;
  /** Part des fiches qualifiées parmi celles soumises. Les rejetées sont hors dénominateur. */
  tauxQualification: number;
  tauxConsentement: number;
}

/** Les filtres de la liste, tels que l'URL les porte. */
export interface IFiltresClients {
  recherche: string;
  partenaires: string[];
  logique: 'AU_MOINS_UN' | 'TOUS';
  debut: string;
  fin: string;
  zones: string[];
  statut: string;
  segment: string;
  consentement: string;
  capturesMax: number | null;
  capturesMin: number | null;
  partenairesMin: number | null;
  page: number;
}

export interface IPageClients {
  content: ILigneClient[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** Une commande dans l'historique d'une fiche. */
export interface ICapture {
  id: string;
  partenaireId: string;
  /** Le NOM de l'établissement. Résolu par le serveur ; à défaut, l'identifiant. */
  partenaire: string;
  source: string;
  dateCommande: string | null;
  numCommande: string | null;
  numCheck: string | null;
  montant: number | null;
  zoneSaisie: string | null;
  rangCapture: number;
  saisiPar: string | null;
  saisiLe: string;
}

/** Ce qu'un client représente CHEZ un partenaire : la ligne qu'un commercial montre. */
export interface IPartPartenaire {
  partenaireId: string;
  /** Le NOM de l'établissement : c'est ce qu'un commercial montre, pas un UUID. */
  partenaire: string;
  nbCaptures: number;
  montant: number;
  premiere: string;
  derniere: string;
}

export interface IAppel {
  id: string;
  date: string;
  action: string;
  joignabilite: string | null;
  tentative: number;
  partenaireAvisId: string | null;
  avisEfficacite: string | null;
  note: number | null;
  pointsSignales: string[];
  commentaire: string | null;
  consentement: string | null;
  qualifiePar: string | null;
}

export interface IFicheClient {
  id: string;
  position: number;
  telephone: string;
  international: boolean;
  nom: string | null;
  prenom: string | null;
  alias: string[];
  zonePrincipaleId: string | null;
  statut: string;
  segment: string | null;
  segmentForce: boolean;
  consentement: string | null;
  consentementDate: string | null;
  consentementSource: string | null;
  /** Par quel canal le rappeler. Renseigne pendant l'appel, quand le client consent. */
  canalPrefere: string | null;
  tags: string[];
  note: string | null;
  nbCaptures: number;
  nbPartenaires: number;
  montantCumule: number;
  /** Nul quand aucun montant n'est connu : zéro est un panier, pas une absence de mesure. */
  panierMoyen: number | null;
  premiereCaptureAt: string | null;
  derniereCaptureAt: string | null;
  partenairePrincipalId: string | null;
  tentativesAppel: number;
  captures: ICapture[];
  parPartenaire: IPartPartenaire[];
  appels: IAppel[];
}

/** L'étape une : le numéro est-il bon ? Tout le reste en découle. */
export type Joignabilite = 'JOIGNABLE' | 'INJOIGNABLE' | 'PAS_LE_BON_CLIENT' | 'FAUX_NUMERO';

/** Un appel, tel que l'écran l'envoie : les trois étapes, ou celles qui s'appliquent. */
export interface IAppelSaisi {
  joignabilite: Joignabilite;
  partenaireAvisId?: string | null;
  avisEfficacite?: string | null;
  note?: number | null;
  pointsSignales?: string[];
  commentaire?: string | null;
  consentement?: string | null;
  prenom?: string | null;
  canalPrefere?: string | null;
}

export interface IResultatAppel {
  clientId: string;
  statut: string;
  tentatives: number;
  alerteQualite: boolean;
  message: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Fusion de doublons
   ───────────────────────────────────────────────────────────────────────────── */

/** Une fiche d'un groupe de doublons, telle qu'on la compare avant d'arbitrer. */
export interface ICandidatFusion {
  id: string;
  /** Masqué par le serveur. Choisir laquelle garder ne demande pas le numéro entier. */
  telephone: string;
  nom: string | null;
  prenom: string | null;
  statut: string;
  nbCaptures: number;
  premiere: string | null;
  derniere: string | null;
}

/**
 * Un groupe de fiches vivantes portant le même nom.
 *
 * <p>Deux fiches ne peuvent pas partager un numéro : un doublon est toujours la même
 * personne sur deux numéros, et le nom saisi est le seul indice. Le serveur PROPOSE,
 * un superviseur arbitre.</p>
 */
export interface IDoublon {
  nom: string;
  nb: number;
  fiches: ICandidatFusion[];
}

/** Ce que le serveur rend après une fusion ou son annulation. */
export interface IBilanFusion {
  fusionId: string;
  sourceId: string;
  cibleId: string;
  capturesDeplacees: number;
  appelsDeplaces: number;
  champsRemplis: string[];
  aliasAjoutes: string[];
  message: string;
}

/** Une ligne du journal des fusions : ce par quoi une fusion se retrouve pour l'annuler. */
export interface ILigneJournalFusion {
  id: string;
  sourceId: string;
  sourceNom: string | null;
  sourceTelephone: string | null;
  cibleId: string;
  cibleNom: string | null;
  cibleTelephone: string | null;
  capturesDeplacees: number;
  appelsDeplaces: number;
  fusionnePar: string | null;
  fusionneAt: string;
  annulee: boolean;
  annulePar: string | null;
  annuleAt: string | null;
  annuleMotif: string | null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Correction d'une fiche
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Ce que l'écran envoie pour corriger une fiche.
 *
 * <p>⚠ `null` veut dire « ne touche pas à ce champ », une chaîne vide ou une liste vide
 * veut dire « efface-le ». Envoyer l'objet entier à chaque fois effacerait ce que
 * l'écran n'affiche pas.</p>
 */
export interface IModificationFiche {
  nom?: string | null;
  prenom?: string | null;
  alias?: string[] | null;
  tags?: string[] | null;
  note?: string | null;
  /** Le poser VERROUILLE la fiche contre le recalcul de nuit ; le vider l'y rend. */
  segmentCode?: string | null;
  typeClient?: string | null;
  zonePrincipaleId?: string | null;
}

export interface IBilanEdition {
  clientId: string;
  champsModifies: string[];
  message: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Liste noire
   ───────────────────────────────────────────────────────────────────────────── */

/** Un numéro qui n'est pas un client : un standard, un livreur, un numéro de test. */
export interface ILigneListeNoire {
  telephone: string;
  telephoneMasque: string;
  libelle: string;
  motif: string | null;
  creePar: string | null;
  createdAt: string;
  /** La fiche retirée en même temps, s'il y en avait une. */
  ficheRetireeId: string | null;
  capturesRetirees: number;
}

export interface IBilanListeNoire {
  telephone: string;
  ficheTouchee: boolean;
  captures: number;
  message: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Statistiques par partenaire
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Ce qu'un partenaire représente dans la base, sur une période.
 *
 * <p>⚠ `nbExclusifs` se calcule SUR LA PÉRIODE demandée, pas sur toute la vie du
 * contact : un client vu chez deux enseignes en août et chez une seule en septembre est
 * exclusif de celle-là pour septembre.</p>
 */
export interface IStatPartenaire {
  partenaireId: string;
  partenaire: string;
  nbClients: number;
  nbCommandes: number;
  montant: number;
  /** Nul quand aucune commande ne porte de montant : zéro serait un panier. */
  panierMoyen: number | null;
  nbExclusifs: number;
  nbPartages: number;
  /** Entre 0 et 1. */
  partExclusifs: number;
}

/** Un partenaire avec qui celui qu'on regarde partage des clients. */
export interface IVoisinPartenaire {
  partenaireId: string;
  partenaire: string;
  nbClients: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Actions groupées
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Poser la même chose sur plusieurs fiches.
 *
 * <p>`segmentCode` suit la convention de la correction : absent veut dire « ne touche
 * pas au segment », vide veut dire « rends ces fiches au recalcul de nuit ».</p>
 */
export interface IActionGroupee {
  clientIds: string[];
  ajouterTags?: string[] | null;
  retirerTags?: string[] | null;
  segmentCode?: string | null;
}

export interface IBilanActionGroupee {
  demandees: number;
  touchees: number;
  ignorees: number;
  message: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Zones
   ───────────────────────────────────────────────────────────────────────────── */

/** Une zone du référentiel. */
export interface IZone {
  id: string;
  libelle: string;
}

/**
 * Un libellé de quartier rencontré sur les tickets, et ce qu'on en a fait.
 *
 * <p>⚠ `arbitre` à faux veut dire « jamais tranché ». `arbitre` à vrai avec `zoneId` nul
 * veut dire « tranché, et ce libellé n'a pas de zone » — « à emporter », par exemple.
 * Sans cette distinction l'écran reproposerait indéfiniment ce qu'on a écarté.</p>
 */
export interface ILibelleZone {
  libelleNormalise: string;
  libelleVu: string;
  nbCaptures: number;
  zoneId: string | null;
  zone: string | null;
  arbitre: boolean;
}

export interface IBilanRapprochement {
  libelle: string;
  zoneId: string | null;
  capturesTouchees: number;
  fichesRecalculees: number;
  message: string;
}

/**
 * Les regles qu'un lot doit respecter, telles que le SERVEUR les applique.
 *
 * <p>⚠ Ces nombres ne se recopient pas dans l'écran. Le plafond vit dans
 * `bdd_parametres` et se règle sans redéployer ; un 500 écrit en dur dans le navigateur
 * face à un 50 en base laissait partir un fichier de deux cents lignes, refusé par le
 * serveur après tout le travail de recomposition des colonnes.</p>
 */
export interface IParametresSaisie {
  /** Nombre maximum de lignes dans UN lot. Au-delà, l'écran découpe. */
  lotLignesMax: number;
  /** Si vrai, une ligne sans montant est refusée. */
  exigerMontant: boolean;
}
