'use server';

import { signIn } from '@/auth';
import { User } from '@/types/models';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { signOut as signOutAuth } from '@/auth';
import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult, PaginatedResponse } from '@/types';
import { processFormData } from '@/utils/formdata-zod.utilities';
import { _createUserSchema, changePasswordSchema, createUserSchema, loginSchema } from '../schemas/users.schema';

const BASE_URL = '/api/V1/turbo/erp/user';

const usersEndpoints = {
    base: { endpoint: `${BASE_URL}`, method: 'GET' },
    login: { endpoint: `${BASE_URL}/login`, method: 'POST' },
    changePassword: { endpoint: `${BASE_URL}/change/password`, method: 'POST' },
    profile: { endpoint: `${BASE_URL}/profile`, method: 'GET' },
    getAll: { endpoint: `${BASE_URL}/get/0`, method: 'GET' },
    getOne: { endpoint: `${BASE_URL}/info`, method: 'GET' },
    update: { endpoint: `${BASE_URL}/update/user`, method: 'POST' },
    disableEnable: { endpoint: (id: string) => `${BASE_URL}/disable/enable/${id}`, method: 'GET' },
    deleteRestaure: { endpoint: (id: string) => `${BASE_URL}/delete/restaured/${id}`, method: 'GET' },
    create: { endpoint: `${BASE_URL}/create`, method: 'POST' },
    // 2026-05 — Bascule du flag notification_email_primary (UI admin).
    // Limite le volume d'emails de workflow sous le quota Hostinger 50/h.
    toggleEmailPrimary: { endpoint: (id: string) => `${BASE_URL}/${id}/toggle-email-primary`, method: 'POST' },
    // 2026-07-30 — Code de sécurité 4 chiffres (DG/DGA), distinct du mot de passe,
    // exigé par main-backend pour les actions finance sensibles (suppression de déduction).
    codeSecurite: { endpoint: `${BASE_URL}/code-securite`, method: 'POST' },
};

export async function loginUser(formData: FormData): Promise<ActionResult<any>> {
    const {
      success,
      data: formdata,
      errorsInArray,
    } = processFormData(loginSchema, formData, {
        useDynamicValidation: true,
    });
  
    if (!success && errorsInArray) {
        return {
            status: 'error',
            message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
        };
    }
  
    try {
        // 🔐 Envoie la requête login
        const result = await fetch(`${process.env.NEXT_PUBLIC_API_ERP_URL}${usersEndpoints.login.endpoint}`, {
            method: usersEndpoints.login.method,
            body: JSON.stringify({ username: formdata.username, password: formdata.password }),
            headers: { 'Content-Type': 'application/json' },
        });
        

        // 🔥 TOUJOURS lire le JSON
        const json = await result.json();

        // console.log('Retour connexion:', json);
        // console.log('HTTP Status:', result.status);

        /**
         * 🔴 CAS SPÉCIAL : 401 mais user retourné
         */
        if (result.status === 401 && json?.user) {
            return {
                status: 'error',
                message: json.message ?? 'Action requise',
                data: {
                    user: json.user,
                    code: json.code,
                },
            };
        }
    
        /**
         * ❌ Autres erreurs HTTP
         */
        if (!result.ok) {
            return {
                status: 'error',
                message: json?.message ?? 'Identifiants incorrects',
            };
        }
  
        // Authentifie via NextAuth
        await signIn('credentials-user', {
            username: formdata.username,
            password: formdata.password,
            redirect: false,
        });
  
        return {
            status: 'success',
            message: 'Connexion réussie',
            data: json,
        };
    } catch (err: any) {
        return {
            status: 'error',
            message: 'Erreur serveur. Veuillez réessayer.',
        };
    }
}
  
export async function changePassword(formData: FormData): Promise<ActionResult<any>> {
    const {
        success,
        data: formdata,
        errorsInArray,
    } = processFormData(changePasswordSchema, formData, {
        useDynamicValidation: true,
    });

    if (!success && errorsInArray) {
        return {
            status: 'error',
            message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
        };
    }

    if (formdata.newPassword !== formdata.confirm_password) {
        return {
            status: 'error',
            message: 'Mot de passe et la confirmation ne sont pas identique',
        };
    }

    try {
        await apiClientHttp.request({
            endpoint: usersEndpoints.changePassword.endpoint,
            method: usersEndpoints.changePassword.method,
            data: {
                newPassword: formdata.newPassword,
                oldPassword: formdata.oldPassword,
                username: formdata.username,
            },
            service: 'erp',
        });
        return {
            status: "success",
            message: "Mot de passe modifié avec succès"
        }
    } catch (error: any) {
        console.log(error);
        return {
            status: 'error',
            message: error?.response?.data?.message || error?.response?.data || 'Erreur lors du changement de mot de passe',
        };
    }
}

export async function signOut(): Promise<void> {
    await signOutAuth();
    revalidatePath('/', 'layout');
    redirect('/auth');
}

export async function getProfile(): Promise<User | null> {
    try {
        const data = await apiClientHttp.request<User>({
            endpoint: usersEndpoints.profile.endpoint,
            method: usersEndpoints.profile.method,
            service: 'erp',
        });

        return data;
    } catch (error) {
        return null;
    }
}

export async function getUsers(): Promise<PaginatedResponse<User> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<User>>({
            endpoint: usersEndpoints.getAll.endpoint,
            method: usersEndpoints.getAll.method,
            service: 'erp',
        });

        return data;
    } catch (error) {
        return null;
    }
}

export async function createUser(formData: FormData): Promise<ActionResult<{ password: string; user: User }>> {
    const {
        success,
        data: formdata,
        errorsInArray,
    } = processFormData(createUserSchema, formData, {
        useDynamicValidation: true,
    });

    if (!success && errorsInArray) {
        return {
            status: 'error',
            message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
        };
    }
    try {
        const data = await apiClientHttp.request<{ password: string; user: User }>({
            endpoint: usersEndpoints.create.endpoint,
            method: usersEndpoints.create.method,
            data: formdata,
            service: 'erp',
        });

        return {
            status: 'success',
            message: 'Utilisateur créé avec succès',
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message || error?.response?.data || "Erreur lors de la création de l'utilisateur",
        };
    }
}

export async function updateUser(
    userId: string,
    formData: FormData
): Promise<ActionResult<{ user: User }>> {
    const {
        success,
        data: formdata,
        errorsInArray,
    } = processFormData(createUserSchema, formData, {
        useDynamicValidation: true,
    });

    if (!success && errorsInArray) {
        return {
            status: 'error',
            message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
        };
    }

    try {
        const data = await apiClientHttp.request<{ user: User }>({
            endpoint: `${usersEndpoints.update.endpoint}/${userId}`,
            method: usersEndpoints.update.method, // généralement PUT ou PATCH
            data: formdata,
            service: 'erp',
        });

        return {
            status: 'success',
            message: 'Utilisateur mis à jour avec succès',
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message:
                error?.response?.data?.message ||
                error?.response?.data ||
                "Erreur lors de la mise à jour de l'utilisateur",
        };
    }
}


export async function deleteRestaureUser(id: string, deleted: boolean): Promise<ActionResult<any>> {
    try {
        await apiClientHttp.request<PaginatedResponse<User>>({
            endpoint: usersEndpoints.deleteRestaure.endpoint(id),
            method: usersEndpoints.deleteRestaure.method,
            service: 'erp',
        });

        return {
            status: 'success',
            message: !deleted ? 'Utilisateur supprimé avec succès' : 'Utilisateur restauré avec succès',
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message || error?.response?.data || (!deleted ? "Erreur lors de la suppression de l'utilisateur" : "Erreur lors de la restauration de l'utilisateur"),
        };
    }
}

export async function disableEnableUser(id: string, status: number): Promise<ActionResult<User>> {
    try {
        const data = await apiClientHttp.request<User>({
            endpoint: usersEndpoints.deleteRestaure.endpoint(id),
            method: usersEndpoints.deleteRestaure.method,
            service: 'erp',
        });

        return {
            status: 'success',
            message: status === 1 ? 'Utilisateur désactivé avec succès' : 'Utilisateur activé avec succès',
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message || error?.response?.data || (status === 1 ? "Erreur lors de la désactivation de l'utilisateur" : "Erreur lors de l'activation de l'utilisateur"),
        };
    }
}

/**
 * 2026-05 — Bascule du flag notification_email_primary pour un utilisateur.
 *
 * Quand activé, l'user reçoit les emails SMTP des notifs de workflow (charges,
 * factures, tickets) en plus du push WS / in-app que tout user du rôle reçoit.
 * Le but : limiter le volume d'emails sous le quota Hostinger 50/h en désignant
 * 1-2 destinataires primaires par rôle (DGA, DG, COMPTABLE, RECOUVREUR…) au
 * lieu d'envoyer un email à TOUS les users actifs du rôle.
 *
 * Retourne le nouvel état du flag, le caller peut s'en servir pour mettre à
 * jour la ligne de la table en optimiste sans refetch full list.
 */
export async function toggleUserEmailPrimary(id: string): Promise<ActionResult<{ id: string; notificationEmailPrimary: boolean; username: string }>> {
    try {
        const data = await apiClientHttp.request<{ id: string; notificationEmailPrimary: boolean; username: string }>({
            endpoint: usersEndpoints.toggleEmailPrimary.endpoint(id),
            method: usersEndpoints.toggleEmailPrimary.method,
            service: 'erp',
        });
        return {
            status: 'success',
            message: data.notificationEmailPrimary
                ? `${data.username} reçoit désormais les emails de notification`
                : `${data.username} ne reçoit plus les emails de notification`,
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message || error?.response?.data || 'Erreur lors de la mise à jour du destinataire email',
        };
    }
}

/**
 * Définit le code de sécurité (4 chiffres) d'un utilisateur DG / DGA.
 * Le mot de passe du compte prouve l'identité ; le code est distinct du mot
 * de passe et sert aux actions finance sensibles (suppression de déduction).
 */
export async function definirCodeSecurite(params: {
    username: string;
    password: string;
    code: string;
}): Promise<ActionResult<any>> {
    if (!/^\d{4}$/.test(params.code)) {
        return { status: 'error', message: 'Le code doit faire exactement 4 chiffres.' };
    }
    try {
        await apiClientHttp.request({
            endpoint: usersEndpoints.codeSecurite.endpoint,
            method: usersEndpoints.codeSecurite.method,
            data: params,
            service: 'erp',
        });
        return { status: 'success', message: 'Code de sécurité enregistré.' };
    } catch (error: any) {
        return {
            status: 'error',
            message:
                error?.data?.message ?? error?.message ?? 'Erreur serveur. Veuillez réessayer.',
        };
    }
}
