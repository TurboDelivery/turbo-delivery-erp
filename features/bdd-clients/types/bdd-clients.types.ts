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
