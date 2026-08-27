'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { Role } from '@/types/models';

const BASE_URL = '/api/V1/turbo/erp/user/roles';

const rolesEndpoints = {
    getAll: { endpoint: BASE_URL, method: 'GET' },
};

export async function getAllRoles(): Promise<Role[]> {
    try {
        const data = await apiClientHttp.request<Role[]>({
            endpoint: rolesEndpoints.getAll.endpoint,
            method: rolesEndpoints.getAll.method,
            service: 'erp',
        });

        return data;
    } catch (error) {
        // Une panne de lecture des roles affichait un selecteur de role VIDE dans les
        // formulaires d ajout et de modification d utilisateur, comme si aucun role
        // n existait, au lieu de signaler l echec.
        throw error;
    }
}
