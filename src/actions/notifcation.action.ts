import { apiClientHttp } from "@/lib/api-client-http";
import { LireNotificationCommande, NotificationDetailsVM, NotificationVM } from "@/types/notifcation.model";


const BASE_URL = '/api/erp/notification';


const notificationEndpoints = {
    getAllNotification: { endpoint: (utilisateurId: string) => `${BASE_URL}/${utilisateurId}/tous`, method: 'GET' },
    getNotificationNonLu: { endpoint: (utilisateurId: string) => `${BASE_URL}/${utilisateurId}/non-lu`, method: 'GET' },
    getNotificationDetail: { endpoint: (notificationId: string) => `${BASE_URL}/${notificationId}`, method: 'GET' },
    upodateNotifcation: { endpoint: `${BASE_URL}`, method: 'PUT' },
};

export async function fetchAllNotifcation(utilisateurId: string): Promise<NotificationVM[]> {
    try {
        const data = await apiClientHttp.request<NotificationVM[]>({
            endpoint: notificationEndpoints.getAllNotification.endpoint(utilisateurId),
            method: notificationEndpoints.getAllNotification.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        // Un echec de lecture n'est pas une liste vide : sur une panne backend
        // l'ecran affichait « Aucune notification » comme si la boite etait vide.
        throw error;
    }
}

export async function fetchNotifcationNonLu(utilisateurId: string): Promise<NotificationVM[]> {
    try {
        const data = await apiClientHttp.request<NotificationVM[]>({
            endpoint: notificationEndpoints.getNotificationNonLu.endpoint(utilisateurId),
            method: notificationEndpoints.getNotificationNonLu.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        // Un echec de lecture n'est pas « zero non-lu » : la panne faisait tomber
        // le compteur a zero et l'operateur croyait avoir tout traite.
        throw error;
    }
}

export async function fetchDetailNotifcation(notificationId: string): Promise<NotificationDetailsVM> {
    try {
        const data = await apiClientHttp.request<NotificationDetailsVM>({
            endpoint: notificationEndpoints.getNotificationDetail.endpoint(notificationId),
            method: notificationEndpoints.getNotificationDetail.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        // Un echec de lecture n'est pas une notification vide : la page de detail
        // affichait un objet et un message vides, dates a l'instant present par
        // moment(undefined), donc une notification credible mais inventee.
        throw error;
    }
}

export async function updateNotifcation(commande: LireNotificationCommande): Promise<any> {
    try {
        const data = await apiClientHttp.request({
            endpoint: notificationEndpoints.upodateNotifcation.endpoint,
            method: notificationEndpoints.upodateNotifcation.method,
            service: 'backend',
            data: commande
        });

        return data;
    } catch (error: any) {
        return {
            message: error.message || 'Une erreur est survenue lors de la mise à jour des notifications',
            status: error.response.status,
        }
    }
}