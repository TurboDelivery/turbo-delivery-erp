'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ChiffreAffaire, ChiffreAffaireRestaurant } from '@/types/statistiques.model';
import { formatDate } from '@/utils/date-formate';
import { RangeValue } from '@heroui/react';

const BASE_URL = '/api/erp/chiffre-affaire';

const statistiquesEndpoints = {
    getAllChiffreAffaire: { endpoint: `${BASE_URL}/tous`, method: 'GET' },
    getAllRestaurantChiffreAffaire: { endpoint: `${BASE_URL}/restaurant`, method: 'GET' },
    getRestaurantChiffreAffaire: { endpoint: (restaurantID: string) => `${BASE_URL}/restaurant/${restaurantID}`, method: 'GET' },
};

export async function getAllChiffreAffaire({ dates: { start, end } }: { dates: RangeValue<Date | null> }): Promise<ChiffreAffaire | null> {
    try {
        const data = await apiClientHttp.request<ChiffreAffaire>({
            endpoint: statistiquesEndpoints.getAllChiffreAffaire.endpoint,
            method: statistiquesEndpoints.getAllChiffreAffaire.method,
            service: 'backend',
            params: {
                dateDebut: start ? formatDate(start, 'YYYY-MM-DD') : '',
                dateFin: end ? formatDate(end, 'YYYY-MM-DD') : '',
            },
        });

        return data;
    } catch (error) {
        return null;
    }
}

export async function getAllRestaurantChiffreAffaire({ dates: { start, end } }: { dates: RangeValue<Date | null> }): Promise<ChiffreAffaireRestaurant[]> {
    try {        
        const data = await apiClientHttp.request<ChiffreAffaireRestaurant[]>({
            endpoint: statistiquesEndpoints.getAllRestaurantChiffreAffaire.endpoint,
            method: statistiquesEndpoints.getAllRestaurantChiffreAffaire.method,
            service: 'backend',
            params: {
                dateDebut: start ? formatDate(start, 'YYYY-MM-DD') : '',
                dateFin: end ? formatDate(end, 'YYYY-MM-DD') : '',
            },
        });

        return data;
    } catch (error) {
        return [];
    }
}

export async function getRestaurantChiffreAffaire(restaurantID: string): Promise<ChiffreAffaire | null> {
    try {
        const data = await apiClientHttp.request<ChiffreAffaire>({
            endpoint: statistiquesEndpoints.getRestaurantChiffreAffaire.endpoint(restaurantID),
            method: statistiquesEndpoints.getRestaurantChiffreAffaire.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        return null;
    }
}
