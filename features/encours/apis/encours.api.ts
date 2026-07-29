import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import {
  IEncoursReleve,
  IEncoursParams,
  IStoreOption,
  IDeductionPartenaire,
  ICreateDeductionPartenaire,
} from '../types/encours.types';

const searchParamsFromFilters = (params: IEncoursParams) => ({
  annee: params.annee,
  mois: params.mois ?? undefined, // omis = « Tous » (cumul annuel)
  cycle: params.cycle || undefined,
  partenaire: params.partenaire || undefined,
  stores: params.stores && params.stores.length ? params.stores.join(',') : undefined,
});

// Backend : main-backend (service erp). /api/finance/encours, /api/finance/encours/groupes,
// /api/finance/deductions-partenaire.
export const encoursAPI = {
  getReleve(params: IEncoursParams): Promise<IEncoursReleve> {
    return api.request<IEncoursReleve>({
      endpoint: 'finance/encours',
      method: 'GET',
      searchParams: searchParamsFromFilters(params) as SearchParams,
    });
  },

  getGroupes(): Promise<string[]> {
    return api.request<string[]>({
      endpoint: 'finance/encours/groupes',
      method: 'GET',
    });
  },

  getStores(partenaire: string): Promise<IStoreOption[]> {
    return api.request<IStoreOption[]>({
      endpoint: 'finance/encours/stores',
      method: 'GET',
      searchParams: { partenaire } as SearchParams,
    });
  },

  // Export serveur (OpenPDF / POI) — renvoie un Blob (binaire). On surcharge le timeout
  // (2 s par défaut, insuffisant pour un gros relevé) et on force responseType: 'blob'.
  exporter(params: IEncoursParams, format: 'pdf' | 'xlsx'): Promise<Blob> {
    return api.request<Blob>({
      endpoint: 'finance/encours/export',
      method: 'GET',
      searchParams: { ...searchParamsFromFilters(params), format } as SearchParams,
      config: { responseType: 'blob', timeout: 120000 },
    });
  },

  listerDeductions(annee: number): Promise<IDeductionPartenaire[]> {
    return api.request<IDeductionPartenaire[]>({
      endpoint: 'finance/deductions-partenaire',
      method: 'GET',
      searchParams: { annee } as SearchParams,
    });
  },

  creerDeduction(dto: ICreateDeductionPartenaire): Promise<IDeductionPartenaire> {
    return api.request<IDeductionPartenaire>({
      endpoint: 'finance/deductions-partenaire',
      method: 'POST',
      data: dto,
    });
  },

  modifierDeduction(id: string, dto: ICreateDeductionPartenaire): Promise<IDeductionPartenaire> {
    return api.request<IDeductionPartenaire>({
      endpoint: `finance/deductions-partenaire/${id}`,
      method: 'PUT',
      data: dto,
    });
  },

  supprimerDeduction(id: string, codeSecret: string): Promise<void> {
    // Le code secret DG transite en header (jamais dans l'URL) ; le backend
    // vérifie contre les comptes du rôle DG et répond 403 si incorrect.
    return api.request<void>({
      endpoint: `finance/deductions-partenaire/${id}`,
      method: 'DELETE',
      config: { headers: { 'X-Code-Secret': codeSecret } },
    });
  },
};
