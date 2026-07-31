import { apiClientHttp } from '@/lib/api-client-http';

// Backend : main-backend, routes /api/erp/pointages (règle owner 2026-07-31) —
// registre des pointages HORS-ZONE : file d'arbitrage (EN_ATTENTE) + historique
// des décisions (VALIDE / REJETE). Un pointage validé compte (et fait entrer le
// livreur en file d'attente si c'est la montée) ; rejeté → pénalité de cote.

export type TypePointage = 'START' | 'MID' | 'MID2' | 'END';
export type ValidationPointage = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

export interface IPointageHorsZone {
  emploiId: string;
  livreurId: string | null;
  livreur: string | null;
  restaurant: string | null;
  date: string;
  type: TypePointage;
  pointeAt: string | null;
  statut: string | null;
  distanceMetres: number | null;
  latitude: number | null;
  longitude: number | null;
  motif: string | null;
  preuveUrl: string | null;
  validation: ValidationPointage;
  valideAt: string | null;
  commentaireValidation: string | null;
  arbitre: string | null;
}

export const TYPE_POINTAGE_LABEL: Record<TypePointage, string> = {
  START: 'Montée',
  MID: 'Relance 1',
  MID2: 'Relance 2',
  END: 'Fin de service',
};

export const VALIDATION_LABEL: Record<ValidationPointage, string> = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
};

export const pointagesValidationAPI = {
  /** Registre complet sur la fenêtre (défaut 30 j) — le filtrage fin est client. */
  lister(depuis?: string): Promise<IPointageHorsZone[]> {
    return apiClientHttp.request<IPointageHorsZone[]>({
      endpoint: '/api/erp/pointages/a-valider',
      method: 'GET',
      params: depuis ? { depuis } : undefined,
    });
  },

  valider(p: IPointageHorsZone, userId: string, commentaire?: string): Promise<void> {
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

  rejeter(p: IPointageHorsZone, userId: string, commentaire: string): Promise<void> {
    return apiClientHttp.request<void>({
      endpoint: `/api/erp/pointages/${p.emploiId}/rejeter`,
      method: 'POST',
      params: { date: p.date, type: p.type, commentaire },
      config: { headers: { 'X-User-Id': userId } },
    });
  },
};
