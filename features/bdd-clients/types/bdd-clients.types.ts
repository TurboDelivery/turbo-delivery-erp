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
