import { PageResponse } from '@/types/page-response';

export type StatutLignePaiement = 'OK' | 'WAVE_MANQUANT';

export interface IGrillePaiementTicketDetail {
  ref: string;       // e.g. TKT-2026-01003
  partenaire: string;
  date: string;      // ISO date
  commission: number;
  fraisLivraison: number;
}

export interface IBonusCritere {
  label: string;
  detail: string;
  valide: boolean;
}

export interface IBonusEligibilite {
  criteres: IBonusCritere[];
  eligible: boolean;
  tauxFinal: number;
  tauxFinalLabel: string; // e.g. "Bonus non éligible — taux standard 60%"
  tauxFinalDetail: string;
}

export interface IGrillePaiementTurboy {
  id: string;
  nom: string;
  code?: string;
}

export interface IGrillePaiementLigne {
  id: string | null;
  turboy: IGrillePaiementTurboy;
  tickets: number;
  brut: number;
  taux: number;
  bonus: boolean;
  tauxManuel: boolean;
  deductions: number;
  netAPayer: number;
  numeroWave?: string;
  commission?: number;
  statut?: StatutLignePaiement;
  flagAttente?: boolean;
  checked: boolean;
  totalFraisLivraison?: number;
  ticketDetails?: IGrillePaiementTicketDetail[];
  bonusEligibilite?: IBonusEligibilite;
}

export interface IGrillePaiementCreneau {
  id: string;
  code: string; // e.g. CRÉNEAU-S16-2026
  debut: string; // ISO date
  fin: string; // ISO date
  lot?: { id: string; libelle: string; statut: string };
  visePar?: string;
  viseAt?: string; // ISO datetime
  lignes: PageResponse<IGrillePaiementLigne>;
  stats: {
    totalLivreurs: number;
    totalTickets: number;
    totalBrut: number;
    totalNet: number;
    waveManquants: number;
  };
}

export interface IFichePaieRestaurant {
  id: string;
  nomEtablissement: string;
  typeCommission: 'POURCENTAGE' | 'FIXE';
  commission: number;
}

export interface IFichePaieDetailJour {
  date: string;
  restaurants: IFichePaieRestaurant[];
  totalJour: number;
}

export interface IFichePaie {
  livreurId: string;
  livreur: string;
  debut: string;
  fin: string;
  nombreJoursTravailles: number;
  detailsLivraisons: IFichePaieDetailJour[];
  totalGeneral: number;
  pourcentageApplicable: number;
  gain: number;
  netAPayer: number;
}

export interface IGrillePaiementParams {
  creneauId?: string;
  page?: number;
  size?: number;
}

export interface IUpdateNumeroWaveParams {
  creneauId: string;
  turboyId: string;
  numeroWave: string;
}
