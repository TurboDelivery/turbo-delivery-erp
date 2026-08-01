import axios, { AxiosInstance, AxiosHeaders, AxiosRequestConfig, AxiosError } from 'axios';
import { auth } from '@/auth';

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

      return config;
    });
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

  private async getSession() {
    let session;

    if (typeof window === 'undefined') {
      session = await auth();
    } else {
      const { getSession } = await import('next-auth/react');
      session = await getSession();
    }

    return session;
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
