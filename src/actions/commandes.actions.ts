'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { Order } from '@/types/models';
import { PageResponse } from '@/types/page-response';

export async function getAllOrders(page: number = 0, size: number = 10): Promise<PageResponse<Order> | null> {
    try {
        const data = await apiClientHttp.request<PageResponse<Order>>({
            endpoint: `/api/V1/turbo/customer/commande/all?page=${page}&size=${size}`,
            method: 'GET',
            service: 'client'
        });

        return data;
    } catch (error) {
        return null;
    }
}

export async function accepterCommande(orderId: string): Promise<Order | null> {
    try {
        const data = await apiClientHttp.request<Order>({
            endpoint: `/api/V1/turbo/customer/commande/accepter`,
            method: "PUT",
            service: "client",
            data: { 'orderId': orderId }
        });

        return data;
    } catch (error) {
        console.error("Erreur lors de l'acceptation de la commande :", error);
        return null;
    }
}

export async function annulerCommande(orderId: string): Promise<Order | null> {
    try {
        const data = await apiClientHttp.request<Order>({
            endpoint: `/api/V1/turbo/customer/commande/annuler`,
            method: "PUT",
            service: "client",
            data: { 'orderId': orderId }
        });
        return data;
    } catch (error) {
        console.error("Erreur lors de l'annulation de la commande :", error);
        return null;
    }
}