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
export type TypeLivreur = 'INDEPENDANT' | 'JOURNALIER';

export interface LivreurTrafic {
    livreurId: string;
    avatarUrl: string;
    nomComplet: string;
    telephone: string;
    position: {
        latitude: number;
        longitude: number;
    };
    course?: boolean; // false si pas de course en cours
    typeLivreur?: TypeLivreur;
}

export interface LivreurCategorie {
    total: number;
    liste: LivreurTrafic[];
}

export interface TraficLivreursResponse {
    disponibles: LivreurCategorie;
    enActivite: LivreurCategorie;
    indisponibles: LivreurCategorie;
    totalLivreurs: number;
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


