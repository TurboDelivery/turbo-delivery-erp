import axios, { AxiosInstance, AxiosHeaders, AxiosRequestConfig, AxiosError } from 'axios';
import { auth } from '@/auth';

export type ServiceType = 'erp' | 'restaurant' | 'livreur' | 'client' | 'backend';

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
      return config;
    });
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
