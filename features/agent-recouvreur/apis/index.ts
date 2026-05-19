import type {
  CycleFiltre,
  IAgentFactureListResponse,
  IAgentFactureParams,
  IAgentFactureStats,
  IEncaissementBody,
  IDepotPartenaireBody,
  IVerserComptableBody,
} from '../types';

const BASE = (process.env.NEXT_PUBLIC_API_BACKEND_URL ?? '').replace(/\/$/, '');

const cycleApiMap: Record<Exclude<CycleFiltre, 'TOUT'>, string> = {
  QUOTIDIEN: 'Quotidien',
  HEBDOMADAIRE: 'Hebdomadaire',
  QUINZAINE: 'Quinzaine',
  MENSUEL: 'Mensuel',
};

function buildFiltersQs(params: IAgentFactureParams | undefined, qs: URLSearchParams) {
  if (params?.cycle && params.cycle !== 'TOUT') {
    qs.set('cycle', cycleApiMap[params.cycle]);
  }
  if (params?.dateDebut) qs.set('dateDebut', params.dateDebut);
  if (params?.dateFin) qs.set('dateFin', params.dateFin);
  if (params?.statut) qs.set('statut', params.statut);
}

export async function getAgentFactures(
  userId: string,
  params?: IAgentFactureParams,
): Promise<IAgentFactureListResponse> {
  const qs = new URLSearchParams();
  buildFiltersQs(params, qs);
  if (params?.page != null) qs.set('page', String(params.page));
  if (params?.size != null) qs.set('size', String(params.size));

  const query = qs.toString() ? `?${qs.toString()}` : '';
  const url = `${BASE}/api/finance/agent-recouvreur/factures${query}`;

  const headers: Record<string, string> = {};
  if (userId) headers['X-User-Id'] = userId;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<IAgentFactureListResponse>;
}

export async function getAgentFacturesStats(
  userId: string,
  params?: IAgentFactureParams,
): Promise<IAgentFactureStats> {
  const qs = new URLSearchParams();
  buildFiltersQs(params, qs);

  const query = qs.toString() ? `?${qs.toString()}` : '';
  const url = `${BASE}/api/finance/agent-recouvreur/factures/stats${query}`;

  const headers: Record<string, string> = {};
  if (userId) headers['X-User-Id'] = userId;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<IAgentFactureStats>;
}

export async function postEncaissement(
  userId: string,
  factureId: string,
  body: IEncaissementBody,
): Promise<void> {
  const res = await fetch(
    `${BASE}/api/finance/agent-recouvreur/factures/${factureId}/encaissements`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(userId ? { 'X-User-Id': userId } : {}) },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}

export async function patchDepotPartenaire(
  userId: string,
  factureId: string,
  body: IDepotPartenaireBody,
): Promise<void> {
  const res = await fetch(
    `${BASE}/api/finance/agent-recouvreur/factures/${factureId}/depot-partenaire`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(userId ? { 'X-User-Id': userId } : {}) },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}

export async function patchVerserComptable(
  userId: string,
  factureId: string,
  body: IVerserComptableBody,
): Promise<void> {
  const res = await fetch(
    `${BASE}/api/finance/agent-recouvreur/factures/${factureId}/verser-comptable`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(userId ? { 'X-User-Id': userId } : {}) },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}
