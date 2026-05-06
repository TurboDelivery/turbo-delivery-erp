export interface IValidationStatsParams {
  role: string;
  debut?: string;
  fin?: string;
}

interface IComptableStats {
  total: number;
  aDecaisser: number;
  decaisse: number;
}

interface IDgaStats {
  enAttente: number;
  montant: number;
}

interface IDgStats {
  enAttente: number;
  approuvees: number;
  montant: number;
}

interface IChargeTypeStats {
  comptable: IComptableStats;
  dga: IDgaStats;
  dg: IDgStats;
}

export interface IValidationStatsResponse {
  fixes: IChargeTypeStats;
  variables: IChargeTypeStats;
}
