import { getCreneauActifApi } from '@/features/creneaux/apis/creneau.api';
import { apiClientHttp } from '@/lib/api-client-http';
import {
  IGrillePaiementCreneau,
  IGrillePaiementLigne,
  IGrillePaiementParams,
  StatutLignePaiement,
} from '../types/grille-paiement.type';

type GrilleStats = {
  totalLivreurs: number;
  totalBrut: number;
  totalNet: number;
  waveManquants: number;
  totalTickets: number;
};

type GrillePaiementVmRaw = {
  id: string;
  code: string;
  debut: string;
  fin: string;
  visePar?: string;
  viseAt?: string;
  stats?: GrilleStats;
  lignes: {
    content: Array<{
      id: string;
      turboy: { id: string; nom: string; code?: string };
      tickets: number;
      brut: number;
      taux: number;
      bonus: boolean;
      tauxManuel: boolean;
      deductions: number;
      netAPayer: number;
      numeroWave?: string;
      statut?: string;
      ticketDetails?: Array<{ ref: string; partenaire: string; date: string; commission: number }>;
      bonusEligibilite?: IGrillePaiementLigne['bonusEligibilite'];
    }>;
  };
};

export async function getGrillePaiementApi(
  _params?: IGrillePaiementParams,
): Promise<IGrillePaiementCreneau | null> {
  try {
    // Use explicit creneauId if provided, otherwise fall back to the active créneau
    let creneauId = _params?.creneauId;
    if (!creneauId) {
      const creneau = await getCreneauActifApi();
      if (!creneau) return null;
      creneauId = creneau.id;
    }

    const vm = await apiClientHttp.request<GrillePaiementVmRaw>({
      endpoint: `/api/creneaux/${creneauId}/grille-paiement`,
      method: 'GET',
      params: { page: '0', size: '20' },
    });

    const stats = vm.stats;

    return {
      id: vm.id,
      code: vm.code,
      debut: vm.debut,
      fin: vm.fin,
      visePar: vm.visePar,
      viseAt: vm.viseAt,
      stats: {
        totalLivreurs: stats?.totalLivreurs ?? 0,
        totalBrut: stats?.totalBrut ?? 0,
        totalNet: stats?.totalNet ?? 0,
        waveManquants: stats?.waveManquants ?? 0,
        totalTickets: stats?.totalTickets ?? 0,
      },
      lignes: (vm.lignes?.content ?? []).map((l) => ({
        id: l.id,
        turboy: { id: l.turboy.id, nom: l.turboy.nom, code: l.turboy.code ?? '' },
        tickets: l.tickets,
        brut: l.brut,
        taux: l.taux,
        bonus: l.bonus,
        tauxManuel: l.tauxManuel,
        deductions: l.deductions,
        netAPayer: l.netAPayer,
        numeroWave: l.numeroWave,
        statut: (l.statut as StatutLignePaiement) ?? (l.numeroWave ? 'OK' : 'WAVE_MANQUANT'),
        checked: false,
        ticketDetails: l.ticketDetails ?? [],
        bonusEligibilite: l.bonusEligibilite ?? {
          criteres: [],
          eligible: false,
          tauxFinal: l.taux,
          tauxFinalLabel: '',
          tauxFinalDetail: '',
        },
      })),
    };
  } catch {
    return null;
  }
}

export async function soumettrGrillePaiementApi(lotId: string, userId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/lots/${lotId}/soumettre-dga`,
    method: 'POST',
    config: { headers: { 'X-User-Id': userId } },
  });
}
