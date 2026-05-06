export type StatutVisaDga = 'EN_ATTENTE' | 'SOUMIS_DGA' | 'VISE' | 'REJETE';

export type StatutEtape = 'done' | 'current' | 'pending';

export interface IEtapeValidation {
  numero: number;
  label: string;
  agent: string;
  statut: StatutEtape;
}

export interface IVisaDgaLivreur {
  id: string;
  nom: string;
  code: string;
  tickets: number;
  numeroWave: string;
  netAPayer: number;
  bonus: boolean;
}

export interface IVisaDgaCreneau {
  id: string;
  code: string;
  debut: string;
  fin: string;
  statut: StatutVisaDga;
  stats: {
    totalLivreurs: number;
    totalTickets: number;
    totalBrut: number;
    totalNet: number;
  };
  livreurs: IVisaDgaLivreur[];
  chaineValidation: IEtapeValidation[];
}
