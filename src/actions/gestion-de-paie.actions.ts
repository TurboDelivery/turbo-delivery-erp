'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { FichePaieDetailVM, GainParJour, PaieErpVM, StatistiqueMoisPaieVM } from '@/types/gestion-de-paie.model';
import { formatDate } from "@/utils/date-formate";

const BASE_URL = '/api/erp';

const gestionPaieEndpoints = {
    fichePaies: { endpoint: `${BASE_URL}/fiche-paie`, method: 'GET' },
    getFichePaieById: { endpoint: (fichePaieId: string) => `${BASE_URL}/fiche-paie/${fichePaieId}`, method: "GET" },
    getGainParJour: { endpoint: (fichePaieId: string) => `${BASE_URL}/fiche-paie/${fichePaieId}/gain`, method: "GET" },
    getStatistiqueFichePaie: { endpoint: `${BASE_URL}/fiche-paie/statistique`, method: "GET" },
    getFicheByEmploiAndLivreur: { endpoint: (emploiId: string, livreurId: string) => `${BASE_URL}/fiche-paie/${livreurId}/creneau/${emploiId}`, method: "GET" }
};

export async function getFicheDePaies(start: Date | null, end: Date | null): Promise<PaieErpVM | null> {
    try {

        const data = await apiClientHttp.request({
            endpoint: gestionPaieEndpoints.fichePaies.endpoint,
            method: gestionPaieEndpoints.fichePaies.method,
            service: 'backend',
            params: {
                debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
                fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
            }
        });

        return data;
    } catch (error: any) {
        // Une lecture en echec renvoyait null : l'ecran de paie affichait la periode
        // sans aucune fiche, comme si aucun livreur n'avait travaille.
        throw error;
    }
}

export async function getFichePaieById(fichePaieId: string): Promise<FichePaieDetailVM | null> {
    try {
        const data = await apiClientHttp.request({
            endpoint: gestionPaieEndpoints.getFichePaieById.endpoint(fichePaieId),
            method: gestionPaieEndpoints.getFichePaieById.method,
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        // Une lecture en echec renvoyait null : le detail de la fiche s'ouvrait vide,
        // laissant croire que la fiche n'avait aucun gain a payer.
        throw error;
    }
};

export async function getFichePaieByEmploiAndLivreur(emploiId: string, livreurId: string): Promise<FichePaieDetailVM | null> {
    try {
        const data = await apiClientHttp.request({
            endpoint: gestionPaieEndpoints.getFicheByEmploiAndLivreur.endpoint(emploiId, livreurId),
            method: gestionPaieEndpoints.getFicheByEmploiAndLivreur.method,
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        // Tout etait avale en bloc, un 404 comme une panne : impossible de distinguer
        // "aucune fiche pour ce creneau" d'une lecture en echec. Le detail s'ouvrait vide.
        throw error;
    }
};

export async function getGainParJour(fichePaieId: string): Promise<GainParJour | null> {
    try {
        const data = await apiClientHttp.request({
            endpoint: gestionPaieEndpoints.getGainParJour.endpoint(fichePaieId),
            method: gestionPaieEndpoints.getGainParJour.method,
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        // Une lecture en echec renvoyait null : le gain par jour s'affichait vide,
        // comme si le livreur n'avait rien gagne sur la periode.
        throw error;
    }
};

export async function getStatistiqueFichePaie(mois: string, annees: string): Promise<StatistiqueMoisPaieVM | null> {
    try {
        const data = await apiClientHttp.request({
            endpoint: gestionPaieEndpoints.getStatistiqueFichePaie.endpoint,
            method: gestionPaieEndpoints.getStatistiqueFichePaie.method,
            service: 'backend',
            params: {
                mois: mois,
                annee: annees
            }
        });
        return data;
    } catch (error: any) {
        // Une lecture en echec renvoyait null : les statistiques du mois tombaient a
        // zero au lieu de signaler que le chiffre n'a pas pu etre lu.
        throw error;
    }
}
