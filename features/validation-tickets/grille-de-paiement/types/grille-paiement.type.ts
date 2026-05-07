export type StatutLignePaiement = 'OK' | 'WAVE_MANQUANT';

export interface IGrillePaiementTicketDetail {
  ref: string;       // e.g. TKT-2026-01003
  partenaire: string;
  date: string;      // ISO date
  commission: number;
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
  code: string; // e.g. TRB-001
}

export interface IGrillePaiementLigne {
  id: string;
  turboy: IGrillePaiementTurboy;
  tickets: number;
  brut: number;
  taux: number;
  bonus: boolean;
  tauxManuel: boolean;
  deductions: number;
  netAPayer: number;
  numeroWave?: string;
  statut: StatutLignePaiement;
  checked: boolean;
  ticketDetails: IGrillePaiementTicketDetail[];
  bonusEligibilite: IBonusEligibilite;
}

export interface IGrillePaiementCreneau {
  id: string;
  code: string; // e.g. CRÉNEAU-S16-2026
  debut: string; // ISO date
  fin: string; // ISO date
  lotId?: string;
  visePar?: string;
  viseAt?: string; // ISO datetime
  lignes: IGrillePaiementLigne[];
  pagination: {
    page: number;
    totalPages: number;
    totalElements: number;
    size: number;
  };
  stats: {
    totalLivreurs: number;
    totalTickets: number;
    totalBrut: number;
    totalNet: number;
    waveManquants: number;
  };
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
