export interface DeliveryFee {
    id?: string;
    name?: string;
    zone: string;
    restaurantId?: string;
    longitude?: number;
    latitude?: number;
    distanceDebut: number;
    distanceFin: number;
    prix: number;
    commission: number;
    /**
     * La zone est-elle proposable ?
     *
     * ⚠ DEUX interfaces `DeliveryFee` decrivent la MEME reponse du serveur : celle-ci et
     * celle de `types/price-list.ts`. Le champ manquait ici, et c'est pour cela que le
     * selecteur de saisie de tickets ne pouvait pas ecarter les zones eteintes. Tout champ
     * ajoute a l'une doit l'etre a l'autre, tant qu'elles n'ont pas ete fusionnees.
     *
     * ⚠ Optionnel, et teste par `!== false` chez l'appelant : un backend qui ne servirait
     * pas encore le champ ne doit pas vider les listes.
     */
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
    typeCommission: 'POURCENTAGE';
    commission: number;
    position: {
        longitude: number;
        latitude: number;
    };
}
