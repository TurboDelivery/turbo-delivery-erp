export type StatutCreneau =
  | 'soumis'
  | 'valide_v1'
  | 'verrouille_v2'
  | 'paye'
  | 'rejete'
  | 'regularisation';

export interface IHistoriqueCreneau {
  id: string;
  code: string;
  periodeDebut: string;
  periodeFin: string;
  livreurs: number;
  tickets: number;
  netFcfa: number;
  soumisLe: string;
  soumisParNom: string;
  statut: StatutCreneau;
  commentaire?: string;
}

export interface IHistoriqueCreneauxStats {
  total: number;
  payes: number;
  enRegularisation: number;
  rejets: number;
}
