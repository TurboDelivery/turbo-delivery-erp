import { getCreneauActifApi } from '@/features/creneaux/apis/creneau.api';
import { apiClientHttp } from '@/lib/api-client-http';
import { IEtapeValidation, IVisaDgaCreneau } from '../types/visa-dga.type';

type GrillePaiementVmRaw = {
  id: string;
  code: string;
  debut: string;
  fin: string;
  visePar?: string;
  viseAt?: string;
  stats?: {
    totalLivreurs: number;
    totalTickets: number;
    totalBrut: number;
    totalNet: number;
  };
  lignes: {
    content: Array<{
      id: string;
      turboy: { id: string; nom: string; code?: string };
      tickets: number;
      netAPayer: number;
      numeroWave?: string;
      bonus: boolean;
    }>;
  };
};

const CHAINE_VALIDATION_DEFAULT: IEtapeValidation[] = [
  { numero: 1, label: 'Saisie ticket',                 agent: '', statut: 'done'    },
  { numero: 2, label: 'V1 — Vérification croisée',     agent: '', statut: 'done'    },
  { numero: 3, label: 'V2 — Verrouillage créneau',     agent: '', statut: 'done'    },
  { numero: 4, label: 'Comptabilité — Grille générée', agent: '', statut: 'done'    },
  { numero: 5, label: 'Visa DGA',                      agent: 'Vous', statut: 'current' },
  { numero: 6, label: 'Approbation PDG',               agent: '—', statut: 'pending' },
];

export async function getVisaDgaApi(creneauId?: string): Promise<IVisaDgaCreneau | null> {
  try {
    let id = creneauId;
    if (!id) {
      const creneau = await getCreneauActifApi();
      if (!creneau) return null;
      id = creneau.id;
    }

    const vm = await apiClientHttp.request<GrillePaiementVmRaw>({
      endpoint: `/api/creneaux/${id}/grille-paiement`,
      method: 'GET',
      params: { page: '0', size: '100' },
    });

    return {
      id: vm.id,
      code: vm.code,
      debut: vm.debut,
      fin: vm.fin,
      statut: vm.viseAt ? 'VISE' : 'SOUMIS_DGA',
      stats: {
        totalLivreurs: vm.stats?.totalLivreurs ?? 0,
        totalTickets:  vm.stats?.totalTickets  ?? 0,
        totalBrut:     vm.stats?.totalBrut     ?? 0,
        totalNet:      vm.stats?.totalNet      ?? 0,
      },
      livreurs: (vm.lignes?.content ?? []).map((l) => ({
        id:          l.turboy.id,
        nom:         l.turboy.nom,
        code:        l.turboy.code ?? '',
        tickets:     l.tickets,
        numeroWave:  l.numeroWave ?? '',
        netAPayer:   l.netAPayer,
        bonus:       l.bonus,
      })),
      chaineValidation: CHAINE_VALIDATION_DEFAULT,
    };
  } catch {
    return null;
  }
}

export async function viserEtTransmettreApi(creneauId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/creneaux/${creneauId}/visa-dga/viser`,
    method: 'POST',
  });
}

export async function rejeterEtRenvoyerApi(creneauId: string, motif: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/creneaux/${creneauId}/visa-dga/rejeter`,
    method: 'POST',
    data: { motif },
  });
}
