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
  lot?: { id: string; libelle: string; statut: string };
  stats?: {
    totalLivreurs: number;
    totalTickets: number;
    totalBrut: number;
    totalNet: number;
    totalAPayer?: number;
    nbIndependants?: number;
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

// Chaîne officielle du workflow : Saisie → Authentification → V1 → V2 →
// Comptabilité → Visa DGA → Approbation PDG. L'étape « Authentification »
// (contrôle du ticket avant la vérification croisée) manquait à l'affichage.
const CHAINE_VALIDATION_DEFAULT: IEtapeValidation[] = [
  { numero: 1, label: 'Saisie ticket',                 agent: '', statut: 'done'    },
  { numero: 2, label: 'Authentification',              agent: '', statut: 'done'    },
  { numero: 3, label: 'V1 — Vérification croisée',     agent: '', statut: 'done'    },
  { numero: 4, label: 'V2 — Verrouillage créneau',     agent: '', statut: 'done'    },
  { numero: 5, label: 'Comptabilité — Grille générée', agent: '', statut: 'done'    },
  { numero: 6, label: 'Visa DGA',                      agent: 'Vous', statut: 'current' },
  { numero: 7, label: 'Approbation PDG',               agent: '—', statut: 'pending' },
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

    const lotStatut = vm.lot?.statut;
    return {
      id: vm.id,
      lotId: vm.lot?.id,
      code: vm.code,
      debut: vm.debut,
      fin: vm.fin,
      statut: vm.viseAt
        ? 'VISE'
        : lotStatut === 'SOUMIS_DGA'    ? 'SOUMIS_DGA'
        : lotStatut === 'REJETE'        ? 'REJETE'
        : lotStatut === 'CALCUL_EN_COURS' ? 'CALCUL_EN_COURS'
        : 'EN_ATTENTE',
      stats: {
        totalLivreurs: vm.stats?.totalLivreurs ?? 0,
        totalTickets:  vm.stats?.totalTickets  ?? 0,
        totalBrut:     vm.stats?.totalBrut     ?? 0,
        totalNet:      vm.stats?.totalNet      ?? 0,
        // V54 — montant à payer = Indépendants uniquement (fallback totalNet
        // si l'ancien backend ne renvoie pas la décomposition).
        totalAPayer:    vm.stats?.totalAPayer    ?? vm.stats?.totalNet      ?? 0,
        nbIndependants: vm.stats?.nbIndependants ?? vm.stats?.totalLivreurs ?? 0,
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

export async function viserEtTransmettreApi(lotId: string, userId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/lots/${lotId}/valider-dga`,
    method: 'POST',
    config: { headers: { 'X-User-Id': userId } },
  });
}

export async function rejeterEtRenvoyerApi(lotId: string, motif: string, userId: string): Promise<void> {
  return apiClientHttp.request<void>({
    endpoint: `/api/lots/${lotId}/rejeter-dga`,
    method: 'POST',
    data: { commentaire: motif },
    config: { headers: { 'X-User-Id': userId } },
  });
}
