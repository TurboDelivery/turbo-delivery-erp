'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { Order, OrderStats, PageResponse } from '@/types/models';

export async function getAllOrders(page: number = 0, size: number = 10, restaurantId: string | null = '', start: string | null = '', end: string | null = ''): Promise<PageResponse<Order> | null> {
    try {
        const data = await apiClientHttp.request<PageResponse<Order>>({
            endpoint: `/api/V1/turbo/customer/commande/all`,
            method: 'GET',
            service: 'client',
            data: {
                'page': page,
                'size': size,
                'restaurantId': restaurantId,
                'start': start,
                'end': end
            }
        });  

        return data;
    } catch (error) {
        return null;
    }
}

export async function getOrdersStats(
    restaurantId: string | null = '',
    start: string | null = '',
    end: string | null = ''
): Promise<OrderStats | null> {
    try {
        const data = await apiClientHttp.request<OrderStats>({
            endpoint: `/api/V1/turbo/customer/commande/stats`,
            method: 'GET',
            service: 'client',
            data: {
                restaurantId,
                start,
                end
            }
        });

        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des stats des commandes', error);
        return null;
    }
}