import { startOfWeek } from 'date-fns';
export interface BonLivraisonTerminee {
    commandeId: string;
    reference: string;
    livreurId: string;
    livreur: string;
    restaurant: string;
    restaurantId: string;
    coutLivraison: number;
    coutCommande: number;
    commission?: number;
    date: string;
    heure: string;
    statut: string;
}

export interface BonLivraison {
    commandeId: string;
    reference: string;
    livreurId: string;
    livreur: string;
    restaurant: string;
    restaurantId: string;
    coutLivraison: number;
    coutCommande: number;
    commission?: number;
    date: string;
    heure: {
        hour: string;
        minute: string;
        second: string;
    };
    statut: string;
}

export type FormatsSupportes = "PDF" | "EXCEL" | "HTML";
export type TypeCommission = 'POURCENTAGE' | 'FIXE';

export interface ParametreBonLivraisonFacture {
    restaurantId: string;
    debut?: string;
    fin?: string;
    type?: TypeCommission | null
    format: FormatsSupportes
}

export interface Ticket {
    reference?: string;
    id: string;
    code?: string;
    livreurId: string;
    livreur: string;
    restaurantId: string;
    restaurant: string;
    montantCommande: string;
    montantLivraison: string;
    coutLivraison: string;
    date: string;
    heure: string;
    isNew?: boolean;    // déjà existant
    isEditing?: boolean; // nouveau champ
    statut: string;
}

export interface LivreurStat {
    count: number;
    totalCommandes: number;
    totalLivraisons: number;
    commission: number;
    tickets: Ticket[];
}