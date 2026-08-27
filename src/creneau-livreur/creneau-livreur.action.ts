'use server';

import { ActionResult, PaginatedResponse } from '@/types';
// import { LivreurStatutVM, Restaurant } from '@/types/models';

import { apiClientHttp } from '@/lib/api-client-http';
import { Restaurant } from '@/types/creneau-turbo';
import { LivreurBird } from '@/types/creneau-bird';
import { CreneauID } from '@/types/creneau-byId';

// Configuration
const BASE_URL = '/api/erp/gestion-creneau';

const creneauEndpoints = {
    base: {
        endpoint: BASE_URL,
        method: 'GET',
    },
 
    getAllCreneauTurbo: {
        endpoint: `${BASE_URL}/turbo`,
        method: 'GET',
    },

    getAllCreneauBird: {
        endpoint: `${BASE_URL}/bird`,
        method: 'GET',
    },
    getAllCreneauProgressionTurbo: {
        endpoint: `${BASE_URL}/turbo/progression`,
        method: 'GET',
    },
    getAllCreneauProgressionBird: {
        endpoint: `${BASE_URL}/bird/progression`,
        method: 'GET',
    },
    getCreneauById: {
        endpoint: (userId: string) => `${BASE_URL}/${userId}`,
        method: 'GET',
    },
};


export async function getAllCreneauTurbo(page: number = 0, size: number = 10): Promise<PaginatedResponse<Restaurant> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<Restaurant>>({
            endpoint: creneauEndpoints.getAllCreneauTurbo.endpoint,
            method: creneauEndpoints.getAllCreneauTurbo.method,
            service: 'backend',
            params: {
                page: String(page),
                size: String(size),
            },
        });

        return data;
    } catch (error) {
        // Un echec de lecture renvoyait null et l ecran des Turboys assignes
        // restait fige sur Chargement, comme si la liste n arrivait jamais.
        throw error;
    }
}


export async function getAllCreneauBird(page: number = 0, size: number = 10, keysearch: string = ''): Promise<PaginatedResponse<LivreurBird> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<LivreurBird> | null>({
            endpoint: creneauEndpoints.getAllCreneauBird.endpoint,
            method: creneauEndpoints.getAllCreneauBird.method,
            service: 'backend',
            params: {
                page: String(page),
                size: String(size),
                keysearch: keysearch,
            },
        });

        return data;
    } catch (error) {
        // Un echec de lecture renvoyait null et l ecran affichait Aucun livreur
        // alors que des Bird existaient bien cote serveur.
        throw error;
    }
}

export async function getAllCreneauPerformanceTurbo(page: number = 0, size: number = 10): Promise<PaginatedResponse<RestaurantProgressionTurbo> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<RestaurantProgressionTurbo> | null>({
            endpoint: creneauEndpoints.getAllCreneauProgressionTurbo.endpoint,
            method: creneauEndpoints.getAllCreneauProgressionTurbo.method,
            service: 'backend',
            params: {
                page: String(page),
                size: String(size),
            },
        });

        return data;
    } catch (error) {
        // Un echec de lecture renvoyait null et l ecran affichait Aucun restaurant,
        // donc aucune progression a traiter, alors que la donnee existait.
        throw error;
    }
}

export async function getAllCreneauPerformanceBird(page: number = 0, size: number = 10, keysearch: string = ''): Promise<PaginatedResponse<CreneauProgressionBird> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<CreneauProgressionBird> | null>({
            endpoint: creneauEndpoints.getAllCreneauProgressionBird.endpoint,
            method: creneauEndpoints.getAllCreneauProgressionBird.method,
            service: 'backend',
            params: {
                page: String(page),
                size: String(size),
                keysearch: String(keysearch),
            },
        });

        return data;
    } catch (error) {
        // Un echec de lecture renvoyait null: sans appelant aujourd hui, ce null
        // serait indiscernable d une progression Bird vide pour le prochain appelant.
        throw error;
    }
}



export async function getCreneauById(userId: string):Promise<CreneauID[] | null> {
  
    try {
        const data = await apiClientHttp.request<CreneauID[] | null>({
            endpoint: creneauEndpoints.getCreneauById.endpoint(userId),
            method: creneauEndpoints.getCreneauById.method,
            service: 'backend',
        });
                
        return data;
    } catch (error: any) {
        // Un echec de lecture renvoyait null et la fiche affichait un emploi du temps
        // vide au lieu des creneaux du livreur. Le catch n examine aucun statut, un
        // 404 legitime n est donc pas distingue d une panne de lecture.
        throw error;
    }
}


