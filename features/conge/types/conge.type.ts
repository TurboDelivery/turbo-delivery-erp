export enum CongeType {
  ANNUEL = 'ANNUEL',
  MALADIE = 'MALADIE',
  SANS_SOLDE = 'SANS_SOLDE',
  MATERNITE = 'MATERNITE',
}

export enum CongeStatut {
  EN_ATTENTE = 'En attente',
  APPROUVEE = 'Approuvée',
  EN_COURS = 'En cours',
  TERMINE = 'Terminé',
  REJETEE = 'Rejetée',
}

export enum DurationType {
  MOIS = 'MOIS',
  QUINZAINE = 'QUINZAINE',
  SEMAINE = 'SEMAINE',
  PERSONNALISE = 'PERSONNALISE',
}

export interface IConge {
  id: string;
  employeeId: string;
  employeeName: string;
  type: CongeType;
  startDate: string;
  endDate: string;
  duration: number;
  statut: CongeStatut;
  reason?: string;
  durationType: DurationType;
  createdAt: string;
  updatedAt: string;
}

export interface ICongesParams {
  page?: number;
  limit?: number;
  type?: CongeType;
  statut?: CongeStatut;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  search?: string;
}

export interface ICongeAddUpdateResponse {
  success: boolean;
  data: IConge;
  message?: string;
}

export interface ICongeDeleteResponse {
  success: boolean;
  message?: string;
}

export interface ICongesStats {
  totalConges: number;
  congesEnAttente: number;
  congesApprouves: number;
  congesEnCours: number;
  congesTermines: number;
  congesRejetes: number;
  joursTotalCeMois: number;
}
