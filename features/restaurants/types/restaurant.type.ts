export interface IPicture {
  id: string;
  pictureUrl: string;
  description?: string;
}

export interface IOpeningHour {
  id: string;
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
  closed: boolean;
}

export type MethodRecouvrementType = 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'QUINZAINE' | 'MENSUEL';

export interface IRestaurant {
  /*
   * ⚠ NE SONT PAS SERVIS par /restaurant/get/all, qui rend un RestaurantVm :
   * `dateCreation`, `dateEdition`, `deleted`, `logo`, `logo_Url`, `documentUrl`, `cni`,
   * `pictures`, `openingHours`, `position`. Ils sont declares ici de longue date et
   * TypeScript compile sans broncher ; les lire donne `undefined` sur les 71 partenaires.
   * La date reellement disponible est `createdAt`. Mesure du 16/09/2026 sur la charge utile
   * de production.
   */
  id: string;
  status: number;
  deleted: boolean;
  dateCreation: string;
  dateEdition: string;
  nomEtablissement: string;
  description: string;
  email: string;
  telephone: string;
  codePostal: string;
  commune: string;
  localisation: string;
  siteWeb: string | null;
  logo: string;
  logo_Url: string;
  dateService: string;
  documentUrl: string;
  cni: string;
  longitude: number | null;
  latitude: number | null;
  idLocation: string | null;
  pictures: IPicture[];
  openingHours: IOpeningHour[];
  position?: {
    longitude: number;
    latitude: number;
  };
  typeCommission: string;
  commission: number;
  methodRecouvrement: MethodRecouvrementType;
  /** Date de création (ISO) — renvoyée par /restaurant/get/all, sert à la vue « Nouveaux ». */
  createdAt?: string;
  /** Groupe de partenaires. Servi par la VM, mais VIDE sur les 71 partenaires (mesuré). */
  groupePartenaire?: string | null;
  /** Établissement ouvert. Servi par la VM, défaut backend TRUE. */
  isOpen?: boolean | null;
  /** Inscription non finalisée. Servi par la VM, défaut backend FALSE. */
  inscriptionEnAttente?: boolean | null;
  /**
   * Ce partenaire a-t-il un compte de connexion au portail ?
   *
   * ⚠ Servi UNIQUEMENT par la fiche `/restaurant/info/{id}`, `undefined` dans la liste :
   * la liste rend 71 partenaires et une lecture par partenaire y ferait 71 requêtes.
   *
   * C'est un booléen et non l'identifiant : la route qui sert la fiche est ouverte sans
   * jeton, et publier les identifiants donnerait de quoi verrouiller les comptes
   * partenaires, qui se bloquent au bout de trois tentatives.
   */
  compteConnexionExistant?: boolean | null;
}

/**
 * Le resultat d un chargement destine a l export.
 *
 * <p>Un booleen explicite plutot qu une valeur sentinelle. L ancienne action rendait `null`
 * en cas d echec, et l ecran en tirait un « Erreur lors de l exportation » qui ne disait
 * jamais POURQUOI : l endpoint appele n existait pas, et personne ne pouvait le savoir
 * depuis l interface. Le motif voyage maintenant jusqu au message.</p>
 *
 * <p>Pourquoi une valeur de retour et non une exception : une Server Action qui leve en
 * production rend au navigateur un message caviarde et un `digest`. Le motif reel ne
 * survivrait pas a la frontiere.</p>
 */
export type ResultatExportPartenaires =
  | { ok: true; lignes: IRestaurant[] }
  | { ok: false; motif: string };

export interface IRestaurantStatsParams {
  search?: string;
  localisation?: string;
  email?: string;
  telephone?: string;
  commune?: string;
  methodRecouvrement?: string;
}

export interface IRestaurantStatsResponse {
  totalPartenaires: number;
  commissions: {
    pourcentage: number;
    fixe: number;
  };
  cyclesPaiement: {
    quotidien: number;
    hebdomadaire: number;
    quinzaine: number;
    mensuel: number;
  };
}

export interface IRestaurantParams {
  page?: number;
  limit?: number;
  search?: string;
  nomEtablissement?: string;
  localisation?: string;
  email?: string;
  telephone?: string;
  commune?: string;
  methodRecouvrement?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  /** Vue par état du compte : 'valides' (3) | 'partiels' (2) | 'nouveaux' (1) | 'inactifs' (0) */
  statut?: string;
}

/** Compteurs par état du compte (cartes cliquables de la page Liste). */
export interface IRestaurantStatusCounts {
  total: number;
  valides: number;
  partiels: number;
  nouveaux: number;
  inactifs: number;
}

