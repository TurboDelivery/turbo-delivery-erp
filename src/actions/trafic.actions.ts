'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { LivreurDisponible, TraficLivreursResponse } from '@/types/models';

// Configuration
const BASE_URL = '/api/erp';

const traficEndpoints = {
    getTraficLivreurs: { endpoint: `${BASE_URL}/trafic/livreur`, method: 'GET' },
    getTraficDelivers: { endpoint: `${BASE_URL}/livreur/statut/trafic`, method: 'GET' },
};

export async function getTraficLivreurs(): Promise<LivreurDisponible[]> {
    try {
        const data = await apiClientHttp.request<LivreurDisponible[]>({
            endpoint: traficEndpoints.getTraficLivreurs.endpoint,
            method: traficEndpoints.getTraficLivreurs.method,
            service: 'erp',
        });

        return data;
    } catch (error) {
        return [];
    }
}


export async function getTraficDelivers(): Promise<TraficLivreursResponse> {
    try {
        const data = await apiClientHttp.request<TraficLivreursResponse>({
            endpoint: traficEndpoints.getTraficDelivers.endpoint,
            method: traficEndpoints.getTraficDelivers.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        // retourne un objet vide avec structure correcte si erreur
        return {
            disponibles: { total: 0, liste: [] },
            enActivite: { total: 0, liste: [] },
            indisponibles: { total: 0, liste: [] },
            totalLivreurs: 0,
        };
    }
}