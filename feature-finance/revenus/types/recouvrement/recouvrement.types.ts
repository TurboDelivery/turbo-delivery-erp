// Dans recouvrement.types.ts
export interface IRecouvrement {
    id: string;
    montant: number;
    dateRecouvrement: string;
    preuve: string;
    restaurantId: string;
    nomRestaurant: string; // Ajoutez cette propriété
    totalFraisLivraisons?: number; // Ajoutez si nécessaire
    totalCommission?: number; // Ajoutez si nécessaire
    // Gardez facture si vous l'utilisez ailleurs, sinon supprimez-le
}

// Pour la création (formulaire) - doit correspondre au schéma Zod
export interface IRecouvrementCreateDTO {
    montant: number;
    dateRecouvrement: string;
    restaurantId: string;
    preuve?: File;
}

// Pour l'envoi à l'API
export interface IRecouvrementSubmission {
    montant: number;
    dateRecouvrement: string;
    restaurantId: string;
    preuve: File;
}

export interface IRecouvrementParams {
    factureId?: string;
    page?: number;
    size?: number;
    sort?: string;
    limit?: number;
    dateRecouvrement?: string;
    restaurantId?: string;
    nomRestaurant?: string;
    montant?: number;
    search?: string;
}