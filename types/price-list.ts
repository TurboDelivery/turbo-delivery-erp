export interface DeliveryFee {
    name?:string
    id?: string;
    zone: string;
    restaurantId?: string;
    longitude?: number;
    latitude?: number;
    distanceDebut: number;
    distanceFin: number;
    prix: number;
    commission: number;
    seuilCommission?: number | null;
    /** Zone active pour la demande de coursier — true par défaut quand absent de la réponse. */
    actif?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface RestaurantDefini {
    id: string;
    idLocation: string;
    logo: string;
    logo_Url: string;
    nomEtablissement: string;
    longitude: number;
    latitude: number;
    typeCommission: 'POURCENTAGE' | 'FIXE';
    commission: number;
    position: {
        longitude: number;
        latitude: number;
    };
}


