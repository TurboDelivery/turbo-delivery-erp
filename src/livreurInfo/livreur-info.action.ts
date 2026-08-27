'use server';

import { LivreurDetail } from '@/types/livreur';
import { apiClientHttp } from '@/lib/api-client-http';

const BASE_URL = '/api/erp/livreur/info';

const livreurInfoEndpoints = {
    base: {
        endpoint: BASE_URL,
        method: 'GET',
    },

    getInfoLivreurId: {
        endpoint: (userId: string) => `${BASE_URL}/${userId}`,
        method: 'GET',
    },

    updateLivreur: {
        endpoint: (userId: string) => `${BASE_URL}/${userId}`,
        method: 'PUT', // si ton API utilise PATCH, tu mets 'PATCH'
    },
};

export async function getInfoLivreurById(userId: string): Promise<LivreurDetail | null> {  
    try {
        const data = await apiClientHttp.request<LivreurDetail | null>({
            endpoint: livreurInfoEndpoints.getInfoLivreurId.endpoint(userId),
            method: livreurInfoEndpoints.getInfoLivreurId.method,
            service: 'backend',
        });
                
        return data;
    } catch (error: any) {
        // Sans relance, une panne de lecture s'affichait comme "Aucun livreur
        // trouve" alors que la fiche existe: l'ecran annoncait une absence au
        // lieu de signaler l'echec.
        throw error;
    }
}

/**
 * 🔄 Update un livreur
 * @param userId - ID du livreur
 * @param payload - Données à mettre à jour (FormData si avec fichiers)
 */
export async function updateLivreur(userId: string, payload: any): Promise<LivreurDetail | null> {
    try {
        const data = await apiClientHttp.request<LivreurDetail | null>({
            endpoint: livreurInfoEndpoints.updateLivreur.endpoint(userId),
            method: livreurInfoEndpoints.updateLivreur.method,
            service: 'backend',
            data: payload, // peut être un objet JSON ou un FormData
        });
        return data;
    } catch (error: any) {
        // Ecriture: pas de relance ici. L'appelant profil/[id]/content.tsx ignore
        // la valeur rendue, donc un echec d'enregistrement passe deja pour un
        // succes: le defaut est chez l'appelant, pas dans ce retour.
        console.error("Erreur updateLivreur:", error);
        return null;
    }
}
