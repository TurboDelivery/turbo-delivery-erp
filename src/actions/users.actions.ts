'use server';

import { signIn } from '@/auth';
import { auth } from '@/auth';
import { User } from '@/types/models';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { signOut as signOutAuth } from '@/auth';
import { apiClientHttp } from '@/lib/api-client-http';
import { tracerConnexion } from './audit-connexion.actions';
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
    // Reinitialisation par un administrateur. L'ERP n'a pas de « mot de passe oublie » :
    // c'est le seul chemin pour rendre l'acces a quelqu'un qui a perdu le sien.
    reinitialiserMotDePasse: {
        endpoint: (id: string) => `${BASE_URL}/generate/password/${id}`,
        method: 'GET',
    },
    // 2026-05 — Bascule du flag notification_email_primary (UI admin).
    // Limite le volume d'emails de workflow sous le quota Hostinger 50/h.
    toggleEmailPrimary: { endpoint: (id: string) => `${BASE_URL}/${id}/toggle-email-primary`, method: 'POST' },
    // 2026-07-30 — Code de sécurité 4 chiffres (DG/DGA), distinct du mot de passe,
    // exigé par main-backend pour les actions finance sensibles (suppression de déduction).
    codeSecurite: { endpoint: `${BASE_URL}/code-securite`, method: 'POST' },
};

/**
 * Cookie miroir de la session de travail, posé par le battement de cœur
 * (`features/supervision/hooks/use-session-heartbeat`). Recopié ici car le module du
 * hook est un module client : les deux constantes doivent rester identiques.
 */
const COOKIE_SESSION_SUPERVISION = 'turbo_erp_session';

/** Session de travail de l'onglet, quand le battement de cœur en a déjà ouvert une. */
function lireSessionSupervision(): string | null {
    try {
        return cookies().get(COOKIE_SESSION_SUPERVISION)?.value ?? null;
    } catch {
        return null;
    }
}

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
  
    // Une tentative de connexion ne doit produire qu'UNE ligne de journal. Ce drapeau
    // évite qu'un incident survenu APRÈS l'émission (typiquement signIn() qui lève)
    // ajoute un ECHEC derrière un LOGIN déjà enregistré pour la même tentative.
    let evenementEmis = false;

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
            // LOG10 = mot de passe CORRECT, mais changement de mot de passe exigé.
            // Ce n'est pas un échec d'authentification : c'est la signature d'une
            // première connexion. Le classer en ECHEC noierait les vraies tentatives
            // d'intrusion sous le bruit des primo-arrivants.
            if (json?.code === 'LOG10') {
                await tracerConnexion({
                    typeEvenement: 'LOGIN',
                    identifiant: formdata.username,
                    utilisateurId: json?.user?.id ?? null,
                    utilisateurNom: json?.user?.username ?? null,
                    motif: 'Première connexion — changement de mot de passe requis',
                });
            } else {
                await tracerConnexion({
                    typeEvenement: 'ECHEC',
                    identifiant: formdata.username,
                    utilisateurId: json?.user?.id ?? null,
                    motif: json?.message ?? 'Action requise',
                });
            }
            evenementEmis = true;

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
            // Journalisé même quand l'identifiant n'existe pas : sans cela, une
            // énumération de comptes ne laisserait aucune trace.
            await tracerConnexion({
                typeEvenement: 'ECHEC',
                identifiant: formdata.username,
                motif: json?.message ?? 'Identifiants incorrects',
            });
            evenementEmis = true;

            return {
                status: 'error',
                message: json?.message ?? 'Identifiants incorrects',
            };
        }

        // ⚠️ Une connexion réussie appelle DEUX fois l'API de login : ici, puis dans
        // authorize() de NextAuth juste en dessous. L'événement n'est émis QUE dans
        // cette server action — instrumenter authorize() produirait deux lignes par
        // connexion dans le journal.
        await tracerConnexion({
            typeEvenement: 'LOGIN',
            identifiant: formdata.username,
            utilisateurId: json?.user?.id ?? null,
            utilisateurNom:
                `${json?.user?.nom ?? ''} ${json?.user?.prenoms ?? ''}`.trim() || (json?.user?.username ?? null),
        });
        evenementEmis = true;

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
        if (!evenementEmis) {
            await tracerConnexion({
                typeEvenement: 'ECHEC',
                identifiant: formdata.username,
                motif: 'Erreur serveur pendant la connexion',
            });
        }

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
        // NE JAMAIS journaliser l'erreur Axios entiere ICI : elle transporte `config.data`,
        // c'est-a-dire le corps de la requete — donc l'ANCIEN et le NOUVEAU mot de passe en
        // clair dans les journaux du serveur Next, a chaque echec de changement. On ne garde
        // que le statut et le message, qui suffisent au diagnostic.
        console.error(
            'Echec du changement de mot de passe',
            error?.response?.status ?? '',
            error?.response?.data?.message ?? error?.message ?? '',
        );
        return {
            status: 'error',
            message: error?.response?.data?.message || error?.response?.data || 'Erreur lors du changement de mot de passe',
        };
    }
}

export async function signOut(): Promise<void> {
    // Déconnexion volontaire : on la journalise AVANT de détruire la session
    // NextAuth, seule occasion de connaître encore l'identité de l'utilisateur.
    // Le sessionId transmis fait fermer la session de présence côté serveur —
    // sans lui, l'utilisateur resterait affiché « en ligne » jusqu'à expiration.
    try {
        const sessionAuth = await auth();
        await tracerConnexion({
            typeEvenement: 'LOGOUT',
            identifiant: sessionAuth?.user?.name ?? sessionAuth?.user?.email ?? '',
            utilisateurId: sessionAuth?.user?.id ?? null,
            utilisateurNom: sessionAuth?.user?.nomComplet ?? sessionAuth?.user?.name ?? null,
            sessionId: lireSessionSupervision(),
        });
    } catch {
        /* le journal ne casse jamais la déconnexion */
    }

    try {
        cookies().delete(COOKIE_SESSION_SUPERVISION);
    } catch {
        /* le hook nettoie de son côté au démontage */
    }

    await signOutAuth();
    revalidatePath('/', 'layout');
    redirect('/auth');
}

/**
 * Profil de l'utilisateur connecte.
 *
 * <p>`null` signifie UNE seule chose : la session n'est pas (ou plus) valide.
 * `app/(protected)/layout.tsx` s'en sert pour rediriger vers `/auth`.</p>
 *
 * <p>Elle avalait AUPARAVANT toute erreur pour renvoyer `null`, y compris un
 * incident reseau ou un 500 : un simple hoquet du backend deconnectait donc TOUT
 * LE MONDE, chacun se retrouvant sur l'ecran de connexion sans comprendre
 * pourquoi. Une panne de lecture n'est pas une session expiree.</p>
 *
 * <p>Desormais seuls 401 et 403 rendent `null`. Le reste REMONTE, et l'ecran
 * d'erreur (`app/error.tsx`) s'affiche avec son bouton « Réessayer », qui laisse
 * la session intacte.</p>
 */
export async function getProfile(): Promise<User | null> {
    try {
        const data = await apiClientHttp.request<User>({
            endpoint: usersEndpoints.profile.endpoint,
            method: usersEndpoints.profile.method,
            service: 'erp',
        });

        return data;
    } catch (error) {
        const statut = (error as { response?: { status?: number } })?.response?.status;
        if (statut === 401 || statut === 403) return null;
        throw error;
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
        // CORRECTIF (17/08/2026) : cette action appelait `delete/restaured`, l'endpoint de
        // SUPPRESSION. « Desactiver » supprimait donc l'utilisateur au lieu de le desactiver,
        // et le drapeau `status` n'etait jamais touche. Les deux entrees du menu, « Desactiver »
        // et « Supprimer », frappaient la meme route : l'une des deux mentait forcement.
        // `usersEndpoints.disableEnable` etait declare mais n'etait appele nulle part.
        const data = await apiClientHttp.request<User>({
            endpoint: usersEndpoints.disableEnable.endpoint(id),
            method: usersEndpoints.disableEnable.method,
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
/**
 * Reinitialise le mot de passe d'un utilisateur, a la demande d'un administrateur.
 *
 * L'ERP ne propose aucun « mot de passe oublie » sur l'ecran de connexion : quand
 * quelqu'un perd son acces, c'est le seul moyen de le lui rendre.
 *
 * Le serveur (erp-backend, `@Secured("ROLE_ADMIN")`) genere le mot de passe, le hache,
 * pose une date d'expiration et remet le drapeau qui FORCE un changement a la prochaine
 * connexion : le mot de passe rendu ici est donc provisoire, et l'utilisateur choisira le
 * sien. Il n'est renvoye qu'une seule fois et n'est stocke en clair nulle part.
 */
export async function reinitialiserMotDePasseUtilisateur(
    id: string
): Promise<ActionResult<{ newPassword: string; message?: string }>> {
    try {
        const data = await apiClientHttp.request<{ newPassword: string; message?: string }>({
            endpoint: usersEndpoints.reinitialiserMotDePasse.endpoint(id),
            method: usersEndpoints.reinitialiserMotDePasse.method,
            service: 'erp',
        });

        if (!data?.newPassword) {
            // Le serveur repond 200 avec un corps d'erreur quand le compte est introuvable :
            // sans ce controle, l'ecran afficherait un mot de passe vide comme un succes.
            return {
                status: 'error',
                message: "Le serveur n'a pas renvoyé de mot de passe. Rien n'a été modifié.",
            };
        }

        return {
            status: 'success',
            message: 'Mot de passe réinitialisé',
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message:
                error?.response?.data?.message ||
                error?.response?.data ||
                'Erreur lors de la réinitialisation du mot de passe',
        };
    }
}

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
