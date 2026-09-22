import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import {
  ICategoriePerte,
  ICreerPerte,
  IEncoursGlobal,
  IPerteStatistiques,
  IPerteVol,
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

  /** Exposition globale, tous exercices — aucun filtre n'y entre, volontairement. */
  getGlobal(): Promise<IEncoursGlobal> {
    return api.request<IEncoursGlobal>({
      endpoint: 'finance/encours/global',
      method: 'GET',
    });
  },

  /** Les motifs de perte actifs, dans leur ordre d'affichage. */
  categoriesPerte(): Promise<ICategoriePerte[]> {
    return api.request<ICategoriePerte[]>({
      endpoint: 'finance/pertes-vols/categories',
      method: 'GET',
    });
  },

  /** Les deux bornes sont obligatoires : sans elles, le serveur rendrait zéro. */
  statistiquesPertes(debut: string, fin: string): Promise<IPerteStatistiques> {
    return api.request<IPerteStatistiques>({
      endpoint: 'finance/pertes-vols/statistiques',
      method: 'GET',
      searchParams: { debut, fin } as SearchParams,
    });
  },

  listerPertes(): Promise<IPerteVol[]> {
    return api.request<IPerteVol[]>({ endpoint: 'finance/pertes-vols', method: 'GET' });
  },

  /**
   * Le code transite par l'en-tête, JAMAIS par l'URL : un paramètre de requête
   * finit dans les journaux d'accès du serveur.
   */
  creerPerte(data: ICreerPerte, codeSecret: string): Promise<IPerteVol> {
    return api.request<IPerteVol>({
      endpoint: 'finance/pertes-vols',
      method: 'POST',
      data,
      config: { headers: { 'X-Code-Secret': codeSecret } },
    });
  },

  /** Annulation TRACÉE : la ligne reste à l'écran, barrée. Le motif est obligatoire. */
  annulerPerte(id: string, motif: string, codeSecret: string): Promise<IPerteVol> {
    return api.request<IPerteVol>({
      endpoint: `finance/pertes-vols/${id}/annuler`,
      method: 'POST',
      data: { motif },
      config: { headers: { 'X-Code-Secret': codeSecret } },
    });
  },

  /**
   * Correction d'une ligne. La facture de rattachement n'en fait pas partie :
   * déplacer une perte d'une facture à une autre change deux soldes à la fois.
   */
  modifierPerte(id: string, data: ICreerPerte, codeSecret: string): Promise<IPerteVol> {
    return api.request<IPerteVol>({
      endpoint: `finance/pertes-vols/${id}`,
      method: 'PUT',
      data,
      config: { headers: { 'X-Code-Secret': codeSecret } },
    });
  },

  /** Suppression DÉFINITIVE. La ligne quitte l'écran ; le journal d'audit la garde. */
  supprimerPerte(id: string, codeSecret: string): Promise<void> {
    return api.request<void>({
      endpoint: `finance/pertes-vols/${id}`,
      method: 'DELETE',
      config: { headers: { 'X-Code-Secret': codeSecret } },
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
