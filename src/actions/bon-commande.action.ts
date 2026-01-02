'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';
import { BonLivraison, ParametreBonLivraisonFacture, BonLivraisonTerminee, Ticket } from '@/types/bon-livraison.model';
import { PaginatedResponse } from '@/types';
import { formatDate } from '@/utils/date-formate';
import { RangeValue } from '@heroui/react';
import axios from 'axios';
// Configuration
const BASE_URL = '/api/erp/bon-livraison';
const BASE_URL_2 = '/api/export/reporting';

const bonLivraisonEndpoints = {
    getBonLivraisonAll: {
        endpoint: `${BASE_URL}/tous`,
        method: 'GET',
    },
    bonLivraisonTerminers: { endpoint: `${BASE_URL}/tous-termines`, method: 'GET' },
    bonLivraisonTerminees: { endpoint: `${BASE_URL}/tous/termines`, method: 'GET' },
    bonLivraisonEnAttentes: { endpoint: `${BASE_URL}/tous-attentes`, method: 'GET' },
    reportingBonLivraison: { endpoint: `${BASE_URL_2}/facture-bon-livraison`, method: "POST" },
    create: { endpoint: `${BASE_URL}/create`, method: 'POST' },
    update: { endpoint: `${BASE_URL}/update`, method: 'PUT' }
};

export async function getBonLivraisonAll(page: number, size: number, { dates: { start, end } }: { dates: RangeValue<string | null> }): Promise<PaginatedResponse<BonLivraison> | null> {
    try {
        const data = await apiClientHttp.request({
            endpoint: bonLivraisonEndpoints.getBonLivraisonAll.endpoint,
            method: bonLivraisonEndpoints.getBonLivraisonAll.method,
            params: {
                page: String(page),
                size: String(size),
                debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
                fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
            },
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        return null;
    }
}

export async function getAllBonLivraisonTerminers(page: number, size: number, { dates: { start, end } }: { dates: RangeValue<string | null> }, typeCommsion: string): Promise<BonLivraison[]> {
    try {
        const data = await apiClientHttp.request<BonLivraison[]>({
            endpoint: bonLivraisonEndpoints.bonLivraisonTerminers.endpoint,
            method: bonLivraisonEndpoints.bonLivraisonTerminers.method,
            params: {
                page: page.toString(),
                size: size.toString(),
                debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
                fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
                type: typeCommsion
            }
        });
        return data;
    } catch (error) {
        return [] as any;
    }
};

export async function getBonLivraisonTerminees({ dates: { start, end } }: { dates: RangeValue<string | null> }): Promise<BonLivraisonTerminee[]> {
    try {
        const data = await apiClientHttp.request<BonLivraisonTerminee[]>({
            endpoint: bonLivraisonEndpoints.bonLivraisonTerminees.endpoint,
            method: bonLivraisonEndpoints.bonLivraisonTerminees.method,
            params: { debut: start ? formatDate(start, 'YYYY-MM-DD') : '', fin: end ? formatDate(end, 'YYYY-MM-DD') : '' }
        });
        return data;
    } catch (error) {
        return [] as any;
    }
};

export async function getAllBonLivraisonEnAttentes(page: number = 0, size: number = 10,
    { dates: { start, end } }: { dates: RangeValue<string | null> }, typeCommsion: string): Promise<BonLivraison[]> {
    try {
        const data = await apiClientHttp.request<BonLivraison[]>({
            endpoint: bonLivraisonEndpoints.bonLivraisonEnAttentes.endpoint,
            method: bonLivraisonEndpoints.bonLivraisonEnAttentes.method,
            params: {
                page: page.toString(),
                size: size.toString(),
                debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
                fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
                type: typeCommsion
            }
        });
        return data;
    } catch (error) {
        return [] as any;
    }
};

export async function reportingBonLivraisonTerminers(parametre: ParametreBonLivraisonFacture): Promise<any | null> {
    try {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BACKEND_URL}${bonLivraisonEndpoints.reportingBonLivraison.endpoint}`,
            parametre,
            {
                responseType: "arraybuffer",
            }
        );
        return response.data;
    } catch (error: any) {
        if (error?.response?.data && error.response?.data?.message) {
            return {
                status: 'error',
                message: error?.response?.data?.message ?? "Erreur lors du traitement",
            };
        } else if (error?.response?.data?.message) {
            return {
                status: 'error',
                message: error?.response?.data?.message ?? "Erreur lors du traitement",
            };
        } else {
            return {
                status: 'error',
                message: "Erreur lors du traitement",
            };
        }
    }
}

/**
 * Créer un nouveau bon de livraison
 */
export async function createBonLivraison(ticket: Ticket): Promise<BonLivraisonTerminee | null> {    
    try {
        const { id, code, ...rest } = ticket;
        const payload = { ...rest, reference: code };

        const data = await apiClientHttp.request<BonLivraisonTerminee>({
            endpoint: bonLivraisonEndpoints.create.endpoint,
            method: bonLivraisonEndpoints.create.method,
            service: 'backend',
            data: payload
        });
        return data;
    } catch (error: any) {
        console.error('Erreur lors de la création du bon de livraison:', error);
        return null;
    }
}

/**
 * Mettre à jour un bon de livraison existant
 */
export async function updateBonLivraison(ticketId: string, ticket: Ticket): Promise<BonLivraisonTerminee | null> {
    try {
        // On clone ticket sans l'id
        const { id, code, ...ticketWithoutId } = ticket;
        const payload = { ...ticketWithoutId, reference: code };

        const data = await apiClientHttp.request<BonLivraisonTerminee>({
            endpoint: bonLivraisonEndpoints.update.endpoint,
            method: bonLivraisonEndpoints.update.method,
            service: 'backend',
            data: { id: ticketId, ...payload }
        });
        return data;
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du bon de livraison:', error);
        return null;
    }
}