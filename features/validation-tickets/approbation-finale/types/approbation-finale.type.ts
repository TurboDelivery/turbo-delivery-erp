export type StatutApprobationFinale = 'EN_ATTENTE' | 'VISE_DGA' | 'APPROUVE' | 'REJETE';

export interface IApprobationLivreur {
  id: string;
  nom: string;
  code: string;
  numeroWave: string;
  netAPayer: number;
}

export interface ISignataire {
  nom: string;
  role: string;
  horodatage: string;
  statut: 'done' | 'current';
}

export interface ITraceabilite {
  action: string;
  agent: string;
  role: string;
  horodatage: string;
  ip: string;
}

export interface IApprobationFinaleCreneau {
  id: string;
  code: string;
  debut: string;
  fin: string;
  statut: StatutApprobationFinale;
  viseDga: {
    agentNom: string;
    horodatage: string;
  };
  stats: {
    totalLivreurs: number;
    totalMontant: number;
  };
  livreurs: IApprobationLivreur[];
  chaineSignatures: ISignataire[];
  traceabilite: ITraceabilite;
}
