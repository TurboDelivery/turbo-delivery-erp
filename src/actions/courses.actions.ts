'use server';

import { ActionResult } from '@/types';
import { CourseExterne, CourseExterneDetail, Restaurant } from '@/types/models';
import { PaginatedResponse } from '@/types';
import { apiClientHttp } from '@/lib/api-client-http';

// Configuration
const BASE_URL = '/api/erp/course-externe';
const BASE_URL_RESTAURANT = '/api/restaurant/course-externe';

const courseEndpoints = {
    updateCourseExterne: { endpoint: BASE_URL, method: 'PUT' },
    // ⚠️ Terminer/Annuler vivent sous /api/restaurant/course-externe (CourseExterneResource),
    // PAS sous /api/erp/course-externe — les anciens chemins /api/erp/... renvoyaient 404.
    terminerCourseExterne: {
        endpoint: `${BASE_URL_RESTAURANT}/terminer`,
        method: 'PUT',
    },
    annulerCourseExterne: { endpoint: `${BASE_URL_RESTAURANT}/annuler`, method: 'PUT' },
    getPaginationCourseExterneEnAttente: {
        endpoint: `${BASE_URL}/en-attente/pagination`,
        method: 'GET',
    },
    getPaginationCourseExterneJournaliere: {
        endpoint: `${BASE_URL}/journaliere`,
        method: 'GET',
    },
    getPaginationCourseExterne: {
        endpoint: (idRestaurant: string) => `${BASE_URL_RESTAURANT}/${idRestaurant}/pagination`,
        method: 'GET',
    },
    getPaginationCourseExterneAutreStatus: {
        endpoint: `${BASE_URL}/autre-statut/pagination`,
        method: 'GET',
    },
    getCourseExterne: {
        endpoint: (idCourse: string) => `${BASE_URL}/${idCourse}`,
        method: 'GET',
    },
};

export async function assignCourseExterne(courseId: string, livreurId: string, frais: number): Promise<ActionResult> {
    try {
        await apiClientHttp.request({
            endpoint: courseEndpoints.updateCourseExterne.endpoint,
            method: courseEndpoints.updateCourseExterne.method,
            data: {
                courseId,
                livreurId,
                frais,
            },
            service: 'backend',
        });

        return {
            status: 'success',
            message: 'Course assignée avec succès',
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message ?? "Erreur lors de l'assignation de la course",
        };
    }
}

export async function getPaginationCourseExterneEnAttente(page: number = 0, size: number = 10): Promise<PaginatedResponse<CourseExterne> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<CourseExterne>>({
            endpoint: courseEndpoints.getPaginationCourseExterneEnAttente.endpoint,
            method: courseEndpoints.getPaginationCourseExterneEnAttente.method,
            params: {
                page: String(page),
                size: String(size),
            },
            service: 'backend',
        });

        return data;
    } catch (error) {
        // Une lecture qui ECHOUE n'est pas une file de dispatch VIDE. En rendant
        // `null`, cette action faisait lire « Aucune course en attente » au dispatch,
        // qui en concluait n'avoir personne a affecter.
        throw error;
    }
}

export async function getPaginationCourseExterneJournaliere(page: number = 0, size: number = 10): Promise<PaginatedResponse<Restaurant> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<Restaurant>>({
            endpoint: courseEndpoints.getPaginationCourseExterneJournaliere.endpoint,
            method: courseEndpoints.getPaginationCourseExterneJournaliere.method,
            params: {
                page: String(page),
                size: String(size),
            },
            service: 'backend',
        });

        return data;
    } catch (error) {
        // Une lecture qui ECHOUE n'est pas une journee SANS course. Le point du jour
        // affichait « Aucune course aujourd'hui » et un bandeau vert « Tout est a
        // jour » alors que les restaurants n'avaient simplement pas pu etre lus.
        throw error;
    }
}

export async function getPaginationCourseExterneAutreStatus(page: number = 0, size: number = 10): Promise<PaginatedResponse<CourseExterne> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<CourseExterne>>({
            endpoint: courseEndpoints.getPaginationCourseExterneAutreStatus.endpoint,
            method: courseEndpoints.getPaginationCourseExterneAutreStatus.method,
            params: {
                page: String(page),
                size: String(size),
            },
            service: 'backend',
        });

        return data;
    } catch (error) {
        // Une lecture qui ECHOUE n'est pas un historique VIDE. L'ecran annoncait
        // « aucune course ne correspond a vos criteres » sur une panne, et la page
        // /all restait bloquee sur un chargement perpetuel.
        throw error;
    }
}
export async function getCourseExterne(idCourse: string): Promise<CourseExterneDetail | null> {
    try {
        const data = await apiClientHttp.request<CourseExterneDetail>({
            endpoint: courseEndpoints.getCourseExterne.endpoint(idCourse),
            method: courseEndpoints.getCourseExterne.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        // Ce catch avalait TOUT en bloc : la page de detail rendait « introuvable »
        // pour une course qui existe mais que la panne empechait de lire. Le backend
        // repond 409 (pas 404) quand la course manque, on ne peut pas trier ici.
        throw error;
    }
}


export async function getPaginationCourseExterne(idRestaurant: string, page: number = 0, size: number = 10): Promise<PaginatedResponse<CourseExterne> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<CourseExterne>>({
            endpoint: courseEndpoints.getPaginationCourseExterne.endpoint(idRestaurant),
            method: courseEndpoints.getPaginationCourseExterne.method,
            service: 'backend',
            params: {
                page: page.toString(),
                size: size.toString(),
            },
        });
        return data;
    } catch (error) {
        // Une lecture qui ECHOUE n'est pas un restaurant SANS course. La fiche
        // partenaire affichait une liste vide et coupait meme l'alarme sonore, qui
        // ne sonne que si des courses sont chargees.
        throw error;
    }
}

export async function terminerCourseExterne(courseId: string): Promise<ActionResult<CourseExterne>> {
    try {
        const data = await apiClientHttp.request<CourseExterne>({
            endpoint: courseEndpoints.terminerCourseExterne.endpoint,
            method: courseEndpoints.terminerCourseExterne.method,
            data: {
                courseId,
            },
            service: 'backend',
        });
        return {
            status: 'success',
            message: 'Course Terminée',
            data: data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message ?? 'Erreur lors de la terminaison de la course',
        };
    }
}

export async function cancelCourseExterne(courseId: string, restaurantId: string): Promise<ActionResult<CourseExterne>> {
    try {
        const data = await apiClientHttp.request<CourseExterne>({
            endpoint: courseEndpoints.annulerCourseExterne.endpoint,
            method: courseEndpoints.annulerCourseExterne.method,
            data: {
                restaurantId,
                courseId,
            },
            service: 'backend',
        });

        return {
            status: 'success',
            message: 'Course Annulée',
            data: data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message ?? 'Erreur lors du traitement',
        };
    }
}
