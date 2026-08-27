'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { Order, OrderStats, PageResponse } from '@/types/models';

// Backend main-backend (post-fusion) : /api/V1/turbo/customer/commandeS/all
// (pluriel). L'ancien chemin singulier /commande/all n'existe pas → 404.
export async function getAllOrders(page: number = 0, size: number = 10, restaurantId: string | null = '', start: string | null = '', end: string | null = ''): Promise<PageResponse<Order> | null> {
    try {
        const data = await apiClientHttp.request<PageResponse<Order>>({
            endpoint: `/api/V1/turbo/customer/commandes/all?page=${page}&size=${size}&restaurantId=${restaurantId ?? ""}&start=${start ?? ""}&end=${end ?? ""}`,
            method: 'GET',
            service: 'client',
        });

        return data;
    } catch (error) {
        // Une panne de lecture renvoyait null : l'ecran affichait alors
        // "aucune commande" alors que les commandes existaient bien.
        throw error;
    }
}

// TODO(backend) : /api/V1/turbo/customer/commandes/stats n'existe pas encore.
// En attendant, on tape l'endpoint et on retourne null si 404 — le composant
// gère gracieusement les stats absentes.
export async function getOrdersStats(
    restaurantId: string | null = '',
    start: string | null = '',
    end: string | null = ''
): Promise<OrderStats | null> {
    try {
        const data = await apiClientHttp.request<OrderStats>({
            endpoint: `/api/V1/turbo/customer/commandes/stats?restaurantId=${restaurantId ?? ""}&start=${start ?? ""}&end=${end ?? ""}`,
            method: 'GET',
            service: 'client',
        });

        return data;
    } catch (error) {
        // Le catch avalait TOUT : une panne du service client faisait simplement
        // disparaitre les cartes de statistiques, sans rien signaler. Seul le 404
        // reste tolere, l'endpoint /commandes/stats n'existant pas encore cote
        // backend (verifie dans CustomerCommandeResource) : le relancer sans
        // condition enverrait la page entiere sur error.tsx a chaque chargement.
        const statut = (error as { response?: { status?: number } })?.response?.status;
        if (statut !== 404) {
            throw error;
        }
        console.error('Erreur lors de la récupération des stats des commandes', error);
        return null;
    }
}