export interface TypeCuisine {
    // Définissez les propriétés de type cuisine ici, par exemple :
    // id: string;
    // nom: string;
}

export interface Role {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    libelle: string;
}

export interface User {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    nom: string;
    prenoms: string;
    image: string;
    username: string;
    email: string;
    changePassword: boolean;
    attemptLogin: number;
    passwordExpired: string;
    dateOfInactivity: string;
    role: Role;
    departement?: string;
    salaire?: number;
    dateEntree?: string;
    // 2026-05 — Destinataire emails de notification de workflow (charges,
    // factures, tickets). Quand true, l'user reçoit les emails SMTP en plus
    // du push WS / in-app que tout user du rôle reçoit. Permet de limiter le
    // volume d'emails sous le quota Hostinger 50/h en désignant 1-2 primaires
    // par rôle. Optional pour rétrocompat — le backend renvoie null si jamais
    // set, comportement fallback = broadcast à tous (cf. SocketNotificationService).
    notificationEmailPrimary?: boolean;
}

export interface Restaurant {
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
    pictures: Picture[];
    openingHours: OpeningHour[];
    position?: {
        longitude: number;
        latitude: number;
    };
    typeCommission: string;
    commission: number;
}


export interface Picture {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    pictureUrl: string;
}

export interface OpeningHour {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    dayOfWeek: string;
    openingTime: string;
    closingTime: string;
    closed: boolean;
}

export interface DeliveryMan {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    nom: string | null;
    prenoms: string | null;
    avatarUrl: string | null;
    telephone: string;
    email: string | null;
    birthDay: string | null;
    gender: string | null;
    cniUrlR: string | null;
    cniUrlV: string | null;
    category: string | null;
    habitation: string | null;
    immatriculation: string | null;
    numeroCni: string | null;
    matricule: string;
    // M1 (RG-05) — statuts de conformité des pièces (servis par LivreurVm). Optionnels
    // (rétrocompat avec les écrans/back qui ne les renvoient pas).
    cniStatut?: 'A_VERIFIER' | 'CONFORME' | 'REFUSE' | null;
    ficheStatut?: 'A_VERIFIER' | 'CONFORME' | 'REFUSE' | null;
    contratStatut?: 'A_VERIFIER' | 'CONFORME' | 'REFUSE' | null;
}

export interface Collection {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    libelle: string;
    description: string;
    picture: string;
    pictureUrl: string;
}

export interface FindOneRestaurant {
    typecuisine: string[];
    restaurant: Restaurant;
}
export interface Ingredient {
    name: string;
    quantity?: string;
}

export interface Accompaniment {
    id: string;
    libelle: string;
    price: number;
    platId?: string;
}

export interface OptionValue {
    id: string;
    valeur: string;
    prixSup: number;
    optionId?: string;
}

export interface Option {
    id: string;
    libelle: string;
    isRequired: boolean;
    maxSelected: number;
    optionValeurs: OptionValue[];
}

export interface Drink {
    id: string;
    label: string;
    price: number;
    volume: string;
    platId?: string;
}

export interface Dish {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    libelle: string;
    description: string;
    disponible: boolean;
    cookTime: string;
    price: number;
    imageUrl: string;
    restaurant: Restaurant;
    collection: Collection;
}

export interface CollectionWithDishes {
    collectionModel: Collection;
    totalPlat: number;
}

export interface DishComplet {
    platM: Dish;
    accompagnementM: Accompaniment[];
    optionPlatM: Option[];
    boissonPlatMs: Drink[];
}

export interface LocationCourseExterne {
    longitude: number;
    latitude: number;
    address: string;
}

export interface DestinataireCourseExterne {
    nomComplet: string;
    contact: string;
}

export interface CommandeCourseExterne {
    id: string;
    libelle: string;
    numero: string;
    dateHeure?: string;
    destinataire: DestinataireCourseExterne;
    lieuRecuperation: Partial<LocationCourseExterne>;
    lieuLivraison: Partial<LocationCourseExterne>;
    modePaiement: string;
    statut: string;
    fraisLivraison: number;
    prix: number;
    livraisonPaye: boolean;
    /** Zone tarifaire résolue (libellé) — renvoyée par le backend sur le détail. */
    zone?: string | null;
}

/** Livreur assigné à une course externe (LivreurVm backend, champs utiles). */
export interface LivreurCourseExterne {
    id: string;
    nom: string;
    prenoms: string;
    telephone: string;
    avatarUrl?: string | null;
    matricule?: string | null;
}

/** Détail complet d'une course externe (GET /api/erp/course-externe/{id}). */
export interface CourseExterneDetail {
    id: string;
    code: string;
    statut: string;
    dateHeureDebut?: string | null;
    dateHeureFin?: string | null;
    total: number;
    commandes: CommandeCourseExterne[];
    restaurant: Partial<Restaurant>;
    livreur?: LivreurCourseExterne | null;
}
export interface CourseExterne {
    id: string;
    code: string;
    statut: string;
    payoutAt: string;
    pickupAt: string;
    createdAt: string;
    deliveredAt: string;
    restaurant: Partial<Restaurant>;
    nombreCommande: number;
    total: number;
    commandes: CommandeCourseExterne[];
}

export interface LivreurDisponible {
    livreurId: string;
    avatarUrl: string;
    nomComplet: string;
    telephone: string;
    position: {
        longitude: number;
        latitude: number;
    };
    course?: CourseExterne;
}

export interface DemandeAssignationVM {
    id?: string;
    nomComplet?: string;
    statutDemandeAssignation?: StatutDemandeAssignationEnum
    type?: string;
    avatarUrl?: string,
    date?: string;
}

export interface ValiderDemandeAssignationCommande {
    demandeAssignationId: string
    restaurantId?: string;
}

export interface LivreurStatutVM {
    livreurId?: string;
    nomPrenom?: string;
    telephone?: string;
    status?: number;
    type?: string;
    restaurantLibelle?: string;
    dateInscription?: string;
    avatarUrl?: string;
}

export interface ChangerStatutLivreurCommande {
    typeLivreur: string;
    livreurId: string;
    restaurantId?: string;

}

export interface ChangerRestaurantLivreurCommande {
    livreurId: string;
    restaurantId: string;
}

export enum StatutDemandeAssignationEnum {
    EN_ATTENTE = "EN_ATTENTE", VALIDE = "VALIDE", REJETER = "REJETER"
}

export enum TypeEnum {
    WAITING, TURBO, FREE
}

// GESTION DES TRAFICS LIVREURS
// V54 (2026-05-29) — Alignement sur la note de cadrage DGA 28/05 : ajout de
// SUPERVISEUR_LIVREUR comme 3e population. Utilisé pour les pins de la carte
// trafic + les types globaux côté legacy. La source canonique reste
// {@code features/turboys/types/turboys.types.ts > TurboyType} (même union).
export type TypeLivreur = 'INDEPENDANT' | 'JOURNALIER' | 'SUPERVISEUR_LIVREUR';

// Statut de service d'un livreur sur la carte TRAFIC.
//
// Refonte 2026-08-01 : la SOURCE DE VÉRITÉ est la file d'attente du jour,
// alimentée par le pointage (montée = entrée, pause et fin = sortie) — c'est
// elle qui décide qui reçoit une course. Le statut suit donc l'ordre
// course > file > a servi aujourd'hui > rien.
//
// Ce qui a disparu de cette union est aussi important : « HORS_RAYON » n'est
// plus un statut mais un DRAPEAU (`horsRayonPoste`), parce qu'un livreur peut
// être disponible ET momentanément loin de son poste. Idem pour la fraîcheur
// GPS (`positionAncienne`) : elle n'a jamais dit si un livreur travaillait,
// seulement si son téléphone avait émis récemment.
export type StatutTrafic = 'DISPONIBLE' | 'EN_COURSE' | 'EN_PAUSE' | 'HORS_SERVICE';

export interface LivreurTrafic {
    livreurId: string;
    avatarUrl: string;
    nomComplet: string;
    telephone: string;
    position: {
        latitude: number;
        longitude: number;
    };
    course?: boolean; // true si une course est en cours
    typeLivreur?: TypeLivreur; // contrat (INDEPENDANT / JOURNALIER / SUPERVISEUR_LIVREUR)
    type?: string; // assignation (TURBO / FREE / WAITING)
    statut?: StatutTrafic;
    quartier?: string | null;
    dernierPointAt?: string | null;
    // ── Drapeaux : des signalements, pas des statuts ────────────────────────
    /** Présent dans la file d'attente du jour → peut recevoir une course. */
    enFile?: boolean;
    /** Rang dans la file (1 = prochain servi), null hors file. */
    rangFile?: number | null;
    /** Position hors du rayon autour de SON poste (même règle que le pointage). */
    horsRayonPoste?: boolean;
    /** Distance à son poste, en mètres — null si aucune position connue. */
    distancePosteMetres?: number | null;
    /** Dernier point GPS trop ancien : le marqueur peut ne plus être à jour. */
    positionAncienne?: boolean;
    /** Une position GPS est connue (sinon : pas de marqueur, mais le livreur existe). */
    aPosition?: boolean;
    /** @deprecated alias historique de `distancePosteMetres` (l'écran n'en dépend plus). */
    distanceSiegeMetres?: number | null;
}

export interface LivreurCategorie {
    total: number;
    liste: LivreurTrafic[];
}

export interface TraficLivreursResponse {
    disponibles: LivreurCategorie;
    enActivite: LivreurCategorie;
    enPause: LivreurCategorie;
    horsService: LivreurCategorie;
    /** Drapeau transverse : ces livreurs figurent AUSSI dans leur bucket de statut. */
    horsRayon: LivreurCategorie;
    /** Alias historique conservé par le backend = enPause + horsService. */
    indisponibles: LivreurCategorie;
    totalLivreurs: number;
    totalEnService: number;
}

// M4 (RG-33) — quartier de la carte TRAFIC (légende + cercles).
export interface QuartierZone {
    id: string;
    libelle: string;
    centreLat: number;
    centreLon: number;
    rayonM: number;
    couleur?: string | null;
    actif: boolean;
}

export interface Restaurant {
    restaurantId: string;
    nomRestaurant: string;
    logo: string;
    coursesEnCours: number;
    coursesTerminees: number;
}


export interface Customer {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    nom: string;
    prenoms: string;
    avatarUrl: string | null;
    telephone: string;
    email: string;
    birthDay: string;
    gender: string;
}

export interface OrderItem {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    price: number;
    quantity: number;
    platId: string;
    optionId: string | null;
    optionValues: string[];
    accompIds: string[];
    drinkIds: string[];
}

export interface Adresse {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    libelle: string;
    etage: string;
    numeroPorte: string;
    infoSupl: string;
    batName: string;
    userM: Customer;
}

export interface Order {
    id: string;
    status: number;
    numero: string;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;

    totalAmount: number;
    orderState: string;

    userM: Customer;

    orderItemM: OrderItem[];

    adresseM: Adresse;

    recipientName: string;
    recipientPhone: string;

    paymentMethod: string;

    deliveryFee: number;
    serviceFee: number;

    restaurantId: string | null;
}


export interface Pageable {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    totalPages?: number;
    totalElements?: number;
    numberOfElements?: number;
    first: boolean;
    last: boolean;
    size: number;
    empty: boolean;
}

export interface PageResponse<T> {
    content: T[];
    pageable: Pageable;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    empty: boolean;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
}

export interface OrderStatsItem {
    amount: number;
    nbre: number;
}

export interface OrderStats {
    total: OrderStatsItem;
    pending: OrderStatsItem;
    completed: OrderStatsItem;
    cancelled: OrderStatsItem;
}


