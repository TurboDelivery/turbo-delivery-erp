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
