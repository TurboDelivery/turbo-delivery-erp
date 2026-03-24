export enum CongeType {
  ANNUEL = "annuel",
  MALADIE = "maladie",
  SANS_SOLDE = "sans solde",
  MATERNITE = "maternité",
  
}

export enum CongeStatut {
  EN_COURS = "En cours",
  TERMINE = "Terminé",
  EN_ATTENTE = "En attente",
  APPROUVEE = "Approuvée",
  REJETEE = "Rejetée",
}

export enum DurationType {
  MOIS = "mois",
  QUINZAINE = "quinzaine",
  SEMAINE = "semaine",
  PERSONNALISE = "personnalise",
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
  durationType?: DurationType;
  createdAt: string;
  updatedAt: string;
}

export interface ICongesParams {
  employeeId?: string;
  type?: CongeType;
  statut?: CongeStatut;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface ICongeAddUpdateResponse extends Pick<IConge,
  'id' | 'employeeId' | 'employeeName' | 'type' | 'startDate' | 'endDate' 
  | 'duration' | 'statut' | 'reason' | 'durationType' | 'createdAt' | 'updatedAt'
> {
  generatedPassword?: string
}

export interface ICongeDeleteResponse {
  success: true;
  message: string;
}

export interface ICongeStats {
  currentlyOnLeave: number;
  takenThisMonth: number;
  completedLeaves: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}
