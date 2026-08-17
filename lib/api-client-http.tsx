import axios, { AxiosInstance, AxiosHeaders, AxiosRequestConfig, AxiosError } from 'axios';
import { auth } from '@/auth';
import type { Session } from 'next-auth';

export type ServiceType = 'erp' | 'restaurant' | 'livreur' | 'client' | 'backend';

/**
 * Clé de la session de travail de l'onglet, produite par le battement de cœur
 * (`features/supervision/hooks/use-session-heartbeat`).
 *
 * Volontairement recopiée ici plutôt qu'importée : le module du hook porte la
 * directive `'use client'`, et ce client HTTP est aussi utilisé depuis des server
 * actions — importer un module client depuis le serveur transformerait la fonction
 * en référence client, inappelable. Les deux constantes doivent rester identiques.
 */
const CLE_SESSION_SUPERVISION = 'turbo.supervision.session-id';

/** Lecture non bloquante de la session de travail. Nulle côté serveur, par nature. */
function lireSessionSupervision(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(CLE_SESSION_SUPERVISION);
  } catch {
    return null;
  }
}

/**
 * Session mémorisée côté navigateur.
 *
 * `getSession()` de next-auth NE lit PAS le contexte du SessionProvider : chaque appel
 * part en requête réseau vers /api/auth/session. Or une requête sortante en réclame
 * TROIS, séquentiellement, AVANT que la requête métier ne parte — `Authorization`,
 * `X-User-Id`, `X-User-Roles`. Sur un poste distant, cela ajoute trois allers-retours
 * HTTPS à la latence de CHAQUE appel, et l'écran de validation en enchaîne un par
 * liste rechargée : c'est là que passaient les 20 à 30 secondes signalées.
 *
 * Relevé en production le 17/08/2026 : 369 201 appels à /api/auth/session pour 6 796
 * requêtes métier, soit 54 pour 1.
 *
 * On mémorise donc brièvement le résultat et on partage la requête en vol, pour que
 * plusieurs appels simultanés n'en déclenchent qu'une seule.
 */
const DUREE_CACHE_SESSION_MS = 30_000;

// `Awaited<ReturnType<typeof auth>>` ne convient pas : en next-auth v5 beta, `auth`
// est aussi un enrobeur de route handler, et TypeScript retient cette surcharge.
// `Session` porte déjà l'augmentation du projet (token, role, id).
type SessionMemorisee = Session | null;

let sessionMemorisee: { valeur: SessionMemorisee; expireA: number } | null = null;
let sessionEnVol: Promise<SessionMemorisee> | null = null;

/** Vidé dès qu'un 401 prouve que la session mémorisée n'est plus valable. */
function oublierSession() {
  sessionMemorisee = null;
  sessionEnVol = null;
}

export class ApiClientHttp {
  private axiosInstance: AxiosInstance;

  constructor(baseUrl: string) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
    });

    // Interceptor pour gérer les réponses
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          oublierSession();
          try {
            const base = process.env.NEXT_PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const url = new URL('/api/auth/logout', base);
            await fetch(url.toString(), { method: 'POST' });
          } catch {}
        }
        return Promise.reject(error);
      },
    );

    // Interceptor pour ajouter les en-têtes
    this.axiosInstance.interceptors.request.use(async (config) => {
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      // Rattache chaque appel métier à la session de travail de l'onglet
      // (SPEC-ERP-TURBO-AUDIT-v2.0 : imputabilité). L'identifiant est produit et
      // tenu à jour par le battement de cœur (features/supervision). Posé ici, et
      // non dans getHeaders(), pour couvrir AUSSI les appels sans `service` — la
      // majorité des appels main-backend.
      const sessionId = lireSessionSupervision();
      if (sessionId) {
        config.headers.set('X-Session-Id', sessionId);
      }

      // Identité de l'appelant (SPEC-ERP-TURBO-AUDIT-v2.0 : imputabilité).
      // Posée ICI, centralement, et non dans getHeaders() : les routes `/api/erp/**`
      // du main-backend sont `permitAll` côté Spring Security, X-User-Id est donc le
      // SEUL élément d'identité dont disposent les gardes serveur (supervision,
      // personnel) et l'écrivain d'audit — un appel sans cet en-tête répond 403 ou
      // journalise une action sans auteur. Même source que `Authorization` : la
      // session next-auth.
      //
      // On n'écrase JAMAIS un X-User-Id déjà posé par l'appelant : certains appels
      // visent volontairement un autre identifiant que celui de la session. Un en-tête
      // présent mais VIDE (appelant dont la session n'était pas encore chargée) est en
      // revanche traité comme absent — sinon il partirait vide et le backend répondrait 403.
      const identiteAppelant = config.headers.get('X-User-Id');
      if (!identiteAppelant || String(identiteAppelant).trim() === '') {
        const userId = await this.lireIdentiteSession();
        if (userId) {
          config.headers.set('X-User-Id', userId);
        }
      }

      // Rôle ERP de l'appelant. Posé ICI et plus seulement dans getHeaders(service) :
      // les appels sans `service` — la majorité de ceux qui visent main-backend — en
      // étaient privés, alors que le RBAC backend est désactivé et que certains
      // endpoints distinguent les rôles (mode « Au choix à chaque facture », §3.2).
      // Sans cet en-tête, ces gardes refusaient tout le monde, y compris le DG.
      const roleAppelant = config.headers.get('X-User-Roles');
      if (!roleAppelant || String(roleAppelant).trim() === '') {
        const role = await this.lireRoleSession();
        if (role) {
          config.headers.set('X-User-Roles', role);
        }
      }

      return config;
    });
  }

  /** Rôle ERP de l'utilisateur courant. Jamais bloquant : null si indisponible. */
  private async lireRoleSession(): Promise<string | null> {
    try {
      const session = await this.getSession();
      const role = session?.user?.role;
      return role ? String(role) : null;
    } catch {
      return null;
    }
  }

  /** Identifiant ERP de l'utilisateur courant. Jamais bloquant : null si indisponible. */
  private async lireIdentiteSession(): Promise<string | null> {
    try {
      const session = await this.getSession();
      const id = session?.user?.id;
      return id ? String(id) : null;
    } catch {
      return null;
    }
  }

  private async getSession(): Promise<SessionMemorisee> {
    // Côté serveur, `auth()` lit le cookie de la requête en cours : rien à mémoriser,
    // et surtout rien à PARTAGER entre deux requêtes d'utilisateurs différents.
    if (typeof window === 'undefined') {
      return auth();
    }

    if (sessionMemorisee && sessionMemorisee.expireA > Date.now()) {
      return sessionMemorisee.valeur;
    }

    if (!sessionEnVol) {
      sessionEnVol = this.chargerSession();
    }

    const enCours = sessionEnVol;
    try {
      return await enCours;
    } finally {
      if (sessionEnVol === enCours) {
        sessionEnVol = null;
      }
    }
  }

  private async chargerSession(): Promise<SessionMemorisee> {
    const { getSession } = await import('next-auth/react');
    const valeur = await getSession();

    // On ne mémorise QUE la session porteuse d'un jeton. Retenir une absence de session
    // ferait partir sans `Authorization` les appels des trente secondes suivant une
    // connexion — donc un 401, donc une déconnexion immédiate.
    if (valeur?.user?.token) {
      sessionMemorisee = { valeur, expireA: Date.now() + DUREE_CACHE_SESSION_MS };
    }

    return valeur;
  }

  private async setHeaders(): Promise<AxiosHeaders> {
    const session = await this.getSession();
    const headers = new AxiosHeaders();
    headers.set('Authorization', session?.user?.token ? `Bearer ${session.user.token}` : '');

    return headers;
  }

  private async getHeaders(service: ServiceType): Promise<AxiosHeaders> {
    const session = await this.getSession();
    const headers = new AxiosHeaders();

    if (service !== 'backend') {
      headers.set('Authorization', session?.user?.token ? `Bearer ${session.user.token}` : '');
    }

    // Rôle ERP de l'utilisateur (libellé, ex. "ADMIN") transmis au backend : le RBAC
    // backend est désactivé, c'est donc le front qui communique le rôle (consommé par
    // les endpoints qui distinguent l'admin, ex. rejet fraude d'un ticket déjà validé V2).
    const role = session?.user?.role;
    if (role) headers.set('X-User-Roles', String(role));

    return headers;
  }

  async request<T = any>({
    endpoint,
    method,
    data,
    params,
    service,
    config,
  }: {
    endpoint: string;
    method: string;
    data?: any;
    params?: Record<string, any>;
    service?: ServiceType;
    config?: AxiosRequestConfig;
  }): Promise<T> {
    if (service) {
      const baseUrl =
        {
          erp: process.env.NEXT_PUBLIC_API_ERP_URL,
          restaurant: process.env.NEXT_PUBLIC_API_RESTO_URL,
          livreur: process.env.NEXT_PUBLIC_API_DELIVERY_URL,
          client: process.env.NEXT_PUBLIC_API_CLIENT_URL,
          backend: process.env.NEXT_PUBLIC_API_BACKEND_URL,
        }[service] || '';

      const headers = await this.getHeaders(service);
      const authToken = headers.get('Authorization');
      const userRoles = headers.get('X-User-Roles');
      config = {
        ...config,
        baseURL: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          ...config?.headers,
          ...(authToken ? { Authorization: authToken } : {}),
          ...(userRoles ? { 'X-User-Roles': userRoles } : {}),
        },
      };
    }
    try {
      if (params) {
        Object.keys(params).forEach((key) => {
          if (params[key] === undefined || params[key] === null) {
            delete params[key];
          }
        });
      }
      const queryString = new URLSearchParams(params).toString();
      const url = `${endpoint.trim()}${queryString ? `?${queryString}` : ''}`;

      switch (method.trim().toLowerCase()) {
        case 'post':
          return (await this.axiosInstance.post(url, data, config)).data;
        case 'put':
          return (await this.axiosInstance.put(url, data, config)).data;
        case 'patch':
          return (await this.axiosInstance.patch(url, data, config)).data;
        case 'delete':
          return (await this.axiosInstance.delete(url, config)).data;
        default:
          return (await this.axiosInstance.get(url, config)).data;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Request failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            baseUrl: error.config?.baseURL,
            method: error.config?.method,
            hasAuth: !!error.config?.headers?.['Authorization'] || !!error.config?.headers?.['authorization'],
            responseData: error.response?.data,
        });
      } else {
        console.error('API error inconnue:', error);
      }

      throw error;
    }
  }
}

export const apiClientHttp = new ApiClientHttp(process.env.NEXT_PUBLIC_API_BACKEND_URL || '');
