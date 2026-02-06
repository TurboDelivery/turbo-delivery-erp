export interface restaurantUpdateCommission {
  restoId: string;
  type: string;
  commission: number;
  methodRecouvrement?: 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'QUINZAINE' | 'MENSUEL';
}
