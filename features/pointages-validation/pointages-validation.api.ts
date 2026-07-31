import { apiClientHttp } from '@/lib/api-client-http';

// Backend : main-backend, routes /api/erp/pointages (règle owner 2026-07-31) —
// arbitrage des pointages HORS-ZONE. Un pointage validé compte (et fait entrer
// le livreur en file d'attente si c'est la montée) ; rejeté → pénalité de cote.

export type TypePointage = 'START' | 'MID' | 'MID2' | 'END';

export interface IPointageAValider {
  emploiId: string;
  livreurId: string | null;
  livreur: string | null;
  date: string;
  type: TypePointage;
  pointeAt: string | null;
  statut: string | null;
  distanceMetres: number | null;
  latitude: number | null;
  longitude: number | null;
  motif: string | null;
  preuveUrl: string | null;
}

export const TYPE_POINTAGE_LABEL: Record<TypePointage, string> = {
  START: 'Montée',
  MID: 'Relance 1',
  MID2: 'Relance 2',
  END: 'Fin de service',
};

export const pointagesValidationAPI = {
  lister(): Promise<IPointageAValider[]> {
    return apiClientHttp.request<IPointageAValider[]>({
      endpoint: '/api/erp/pointages/a-valider',
      method: 'GET',
    });
  },

  valider(p: IPointageAValider, userId: string, commentaire?: string): Promise<void> {
    return apiClientHttp.request<void>({
      endpoint: `/api/erp/pointages/${p.emploiId}/valider`,
      method: 'POST',
      params: {
        date: p.date,
        type: p.type,
        ...(commentaire ? { commentaire } : {}),
      },
      config: { headers: { 'X-User-Id': userId } },
    });
  },

  rejeter(p: IPointageAValider, userId: string, commentaire: string): Promise<void> {
    return apiClientHttp.request<void>({
      endpoint: `/api/erp/pointages/${p.emploiId}/rejeter`,
      method: 'POST',
      params: { date: p.date, type: p.type, commentaire },
      config: { headers: { 'X-User-Id': userId } },
    });
  },
};
