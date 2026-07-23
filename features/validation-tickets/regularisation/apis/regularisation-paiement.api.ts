import { apiClientHttp } from '@/lib/api-client-http';

/** Ligne du point par livreur (tickets régularisés, net = brut × 0,6). */
export interface ILigneRecapRegularisation {
  turboyId: string;
  nom: string;
  typeLivreur: string | null;
  nbTickets: number;
  brut: number;
  net: number;
  inclusDansPaie: boolean;
  numeroWave: string | null;
}

export interface IRecapRegularisation {
  lotId: string | null;
  lotStatut: string | null;
  lignes: ILigneRecapRegularisation[];
  totalAPayer: number;
  nbTickets: number;
  ticketsHorsLot: number;
}

/** Point par livreur des tickets régularisés du créneau + état du lot de paiement. */
export async function getRecapRegularisationApi(creneauId: string): Promise<IRecapRegularisation> {
  return apiClientHttp.request<IRecapRegularisation>({
    endpoint: `/api/creneaux/${creneauId}/regularisation/recap`,
    method: 'GET',
  });
}

/** Génère/complète le lot REGULARISATION (prêt pour la chaîne Comptable→DGA→DG→Wave). */
export async function genererLotRegularisationApi(
  creneauId: string,
  userId: string,
): Promise<IRecapRegularisation> {
  return apiClientHttp.request<IRecapRegularisation>({
    endpoint: `/api/creneaux/${creneauId}/regularisation/generer-lot`,
    method: 'POST',
    config: { headers: { 'X-User-Id': userId } },
  });
}

/** Chaîne de validation du lot (endpoints lots existants, génériques). */
export async function soumettreLotRegulApi(lotId: string, userId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/lots/${lotId}/soumettre-dga`,
    method: 'POST',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function viserLotRegulApi(lotId: string, userId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/lots/${lotId}/valider-dga`,
    method: 'POST',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function approuverLotRegulApi(lotId: string, userId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/lots/${lotId}/approuver-dg`,
    method: 'POST',
    config: { headers: { 'X-User-Id': userId } },
  });
}
