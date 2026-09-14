export interface IMainKPIs {
  totalDeliveries: number;
  /**
   * Ce que le partenaire a vendu grace a nos livraisons : la somme du prix des commandes
   * terminees. C'est le chiffre d'affaires que la page annonce en tete.
   */
  totalOrderValue: number;
  /**
   * Part des courses terminees parmi les courses CONCLUES, terminees ou annulees.
   *
   * <p>`null` quand aucune course n'a ete conclue sur la periode : le taux n'existe pas
   * alors, et « 0 % » se lirait comme un echec total. L'ecran affiche un tiret.</p>
   */
  successRate: number | null;
  /**
   * Commission + frais de livraison des courses terminees, c'est-a-dire ce que TURBO
   * facture, et non ce que le partenaire encaisse.
   *
   * <p>Toujours servi par l'API, PLUS AFFICHE : le meme montant figure, sous son vrai nom,
   * dans le detail financier (« Facture totale a regler »). La carte qui le montrait en
   * tete de page s'appelait « Chiffre d'Affaires » et additionnait en plus les entrees de
   * caisse GLOBALES, donc l'argent des autres partenaires.</p>
   */
  chiffreAffaires: number;
}

export interface IGeographicLocation {
  name: string;
  deliveries: number;
  value: number;
  color: string;
}

export interface IWeeklyActivity {
  day: string; // French day name returned by API: "Lundi", "Mardi", etc.
  deliveries: number;
  revenue: number;
}

export interface IPerformanceParams {
  debut: Date;
  fin: Date;
  /** Mode UNITAIRE. Conserve tel quel : des liens circulent avec ce seul parametre. */
  restaurantId?: string;
  /** Mode MULTI : plusieurs partenaires coches a la main. */
  restaurantIds?: string[];
  /** Mode GROUPE : un groupe deja constitue dans l'ERP. */
  groupeId?: string;
}

/**
 * Les trois chiffres secondaires, TOUS nullables, et le type doit le dire.
 *
 * <p>Le serveur rend `null` quand la grandeur n'est pas mesurable, au lieu d'un zero qui
 * se lirait comme une mesure : `averageDeliveryTime` quand aucune course de la periode ne
 * porte d'horodatage, `monthlyGrowth` quand le mois precedent n'a aucune livraison, et
 * `averageItemsPerOrder` toujours, faute de source pour cette population.</p>
 *
 * <p>Les declarer `number` faisait mentir le type : les trois consommateurs testaient deja
 * l'absence, mais rien ne les y obligeait, et le prochain appel a `.toFixed()` sans garde
 * aurait fait une page blanche.</p>
 */
export interface ISecondaryKPIs {
  averageDeliveryTime: number | null;
  monthlyGrowth: number | null;
  averageItemsPerOrder: number | null;
}

export interface IFinancialDetails {
  totalOrderAmount: number;
  deliveryFeesCollected: number;
  turboDeliveryServiceFees: number;
  totalFacture: number;
}

/**
 * Interface principale regroupant l'ensemble des données du tableau de bord
 */
export interface IDashboardData {
  /**
   * Ce sur quoi le rapport a ete calcule. Toujours present, y compris en vue globale.
   *
   * <p>Optionnel dans le TYPE, et pas dans le contrat : une reponse mise en cache avant
   * l'arrivee de ce bloc, ou un banc qui ne le fabrique pas, ne doit pas faire tomber
   * l'ecran sur un `selection.mode` lu dans le vide.</p>
   */
  selection?: ISelectionAnalytics;
  mainKPIs: IMainKPIs;
  geographicData: IGeographicLocation[];
  weeklyActivity: IWeeklyActivity[];
  secondaryKPIs: ISecondaryKPIs;
  financialDetails: IFinancialDetails;
  /**
   * Le detail par etablissement.
   *
   * <p>⚠ NULL en `GLOBAL` et en `UNITAIRE` : il n'y a rien a detailler, et un tableau vide
   * se lirait « aucun store », ce qui serait faux. NON NUL, eventuellement VIDE, en `MULTI`
   * et en `GROUPE`. La distinction pilote l'affichage du bloc : `null` le retire,
   * `[]` l'affiche avec sa raison.</p>
   */
  parStore?: IStorePerformance[] | null;
  /**
   * Le recouvrement des factures de la période.
   *
   * <p>⚠ NUL en vue GLOBALE, où aucun partenaire n'est choisi : la liste serait alors toutes
   * les factures du mois de tous les partenaires, ce qui n'est plus un détail de rapport mais
   * l'écran Responsable Financier. Et la vue globale est l'état d'ARRIVÉE de l'écran, pas un
   * cas rare : tant qu'aucun partenaire n'est sélectionné, le rapport y est. Le bloc doit donc
   * dire pourquoi il manque, pas disparaître en silence.</p>
   *
   * <p>Présent en unitaire, multi et groupe.</p>
   */
  recouvrements?: IRecouvrementPeriode | null;
}
/**
 * Ce sur quoi le rapport a REELLEMENT ete calcule, tel que le serveur l'arbitre.
 *
 * <p>Miroir de `SelectionAnalyticsVm`. L'endpoint accepte trois facons de designer une
 * selection et ne rend jamais 400 : il tranche par precedence `groupeId` > `restaurantIds`
 * > `restaurantId` et rend son arbitrage ici. C'est CE bloc qui nomme l'ecran, pas l'URL :
 * un en-tete qui annonce « Groupe AGHA » quand le serveur a agrege autre chose est un
 * mensonge silencieux, et c'est exactement ce que ce bloc empeche.</p>
 */
export interface ISelectionAnalytics {
  /** `GLOBAL` | `UNITAIRE` | `MULTI` | `GROUPE`. Jamais nul. */
  mode: 'GLOBAL' | 'UNITAIRE' | 'MULTI' | 'GROUPE';
  /** Renseigne en `UNITAIRE` seulement. */
  restaurantId: string | null;
  /**
   * Les etablissements effectivement agreges, apres deduplication. Jamais nul.
   * Vide en `GLOBAL` (aucun filtre) ET en `GROUPE` quand le groupe est inconnu ou vide.
   */
  restaurantIds: string[];
  groupeId: string | null;
  /**
   * ⚠ Les deux cas de groupe se distinguent ICI, et nulle part ailleurs :
   * `groupeNom` NUL avec `restaurantIds` vide = groupe INCONNU (dissous, ou mauvais lien).
   * `groupeNom` NON NUL avec `restaurantIds` vide = groupe REEL mais VIDE.
   * Deux causes differentes, donc deux messages differents a l'operateur.
   */
  groupeNom: string | null;
  /** Les parametres de selection recus puis ecartes par la precedence. Jamais nul. */
  parametresIgnores: string[];
}

/**
 * Une ligne du bloc « Detail par store », servie DANS LA MEME REPONSE que le consolide.
 *
 * <p>C'est ce qui rend l'addition a l'oeil possible : la somme des lignes vaut le total de
 * tete pour les livraisons, la valeur des commandes, les frais, la commission et la
 * facture. Verifie en production au franc pres. Deux appels a deux instants differents ne
 * garantiraient pas cela.</p>
 *
 * <p>⚠ `successRate` est la SEULE grandeur qui ne s'additionne pas : le taux de tete est
 * celui de l'ensemble, pas la moyenne des lignes. Aucun total ne se met sous cette
 * colonne.</p>
 */
export interface IStorePerformance {
  restaurantId: string;
  /** NULL quand l'identifiant ne correspond a aucun etablissement : l'identifiant sert alors de repli. */
  nom: string | null;
  totalDeliveries: number;
  totalOrderValue: number;
  /** NULL quand aucune course de ce store n'est conclue sur la periode. */
  successRate: number | null;
  deliveryFeesCollected: number;
  turboDeliveryServiceFees: number;
  totalFacture: number;
}

/**
 * Une facture de la période, avec ce qui en a été recouvré.
 *
 * <p>⚠ `recouvre` est ce qui a été porté au crédit de la facture À CE JOUR, pas ce qui est
 * rentré pendant la période du rapport : aucune colonne ne date un encaissement. Et ce n'est
 * pas non plus « ce que l'agent recouvreur a déclaré recevoir » — la validation d'une facture
 * consomme les acomptes du restaurant et décrémente le restant sans qu'aucun agent n'ait rien
 * déclaré.</p>
 */
export interface IRecouvrementFacture {
  restaurantId: string;
  /** NUL sur une sélection unitaire : l'établissement est déjà le titre du rapport. */
  etablissement: string | null;
  /** La référence maison, du type `F20260811-AGHA-04217`. NULLE sur une vieille ligne. */
  code: string | null;
  /** GLOBALE, FRAIS ou COMMISSION : une même période peut porter deux factures. */
  composante: string | null;
  periodeDebut: string;
  periodeFin: string;
  montant: number;
  recouvre: number;
  restant: number;
  statut: string | null;
}

/**
 * Le bloc « Recouvrement des factures de la période ».
 *
 * <p>⚠ Les totaux NE SE DÉDUISENT PAS de `lignes` : la liste est plafonnée côté serveur, les
 * totaux portent sur toutes les factures, et `nombreFactures` dit combien il y en avait. C'est
 * ce qui permet à l'écran d'annoncer la troncature au lieu de la subir.</p>
 *
 * <p>⚠ Ces totaux ne se soustraient pas de « Facture totale à régler » : ce montant-là vient
 * des COURSES, celui-ci des FACTURES, et les deux règles diffèrent sur les tickets écartés
 * pour fraude et sur les périodes de désactivation.</p>
 */
/**
 * Un mouvement d'argent sur une facture : une somme, un jour, une personne.
 *
 * <p>Deux evenements portent un montant, et ce sont les deux moments qui comptent : quand
 * l'agent de recouvrement a encaisse chez le partenaire (« Acompte reçu », « Facture soldée »),
 * et quand l'argent a ete remis au caissier (« Versement au caissier effectué »).</p>
 *
 * <p>⚠ Cette chronologie est PURGEABLE : réinitialiser une facture l'efface. Une facture peut
 * donc porter un montant recouvré sans aucun mouvement, et ce n'est pas une anomalie de
 * lecture. L'écran le dit plutôt que de laisser croire que rien n'a été encaissé.</p>
 */
export interface IMouvementRecouvrement {
  /** La référence de la facture concernée. NULLE sur une vieille ligne sans code. */
  factureCode: string | null;
  date: string | null;
  libelle: string;
  montant: number;
  /** Le nom de la personne. NUL quand l'employé n'est plus retrouvable. */
  par: string | null;
}

export interface IRecouvrementPeriode {
  lignes: IRecouvrementFacture[];
  /** Le nombre RÉEL de factures de la période, avant plafond. */
  nombreFactures: number;
  totalMontant: number;
  totalRecouvre: number;
  totalRestant: number;
  /**
   * La chronologie des encaissements, toutes factures confondues, du plus ancien au plus
   * récent. VIDE quand aucun mouvement n'est tracé.
   */
  mouvements: IMouvementRecouvrement[];
}
