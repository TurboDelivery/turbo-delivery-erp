export interface IEmployee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  statut: 'Actif' | 'Inactif' | 'Congé';
  entryDate: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'annuel' | 'maladie' | 'sans solde' | 'ANNUEL' | 'MALADIE' | 'SANS_SOLDE' | 'MATERNITE';
  startDate: string;
  endDate: string;
  duration: number;
  statut: 'En cours' | 'Terminé' | 'En attente' | 'Approuvée' | 'Rejetée';
  reason?: string;
  createdAt?: string;
}

export interface Deduction {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Retard' | 'Absence injustifiée' | 'Dommage matériel' | 'Avance sur salaire';
  amount: number;
  reason: string;
  date: string;
  statut: 'Appliquée' | 'En attente';
  repaymentDuration?: number;
}

export interface Department {
  id: string;
  name: string;
}

export interface Function {
  id: string;
  name: string;
}

export interface LeaveStats {
  currentlyOnLeave: number;
  takenThisMonth: number;
  completedLeaves: number;
}

export interface RequestStats {
  pending: number;
  approved: number;
  rejected: number;
}

export interface DeductionStats {
  totalThisMonth: number;
  pendingValidation: number;
}

export interface Loan {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Avance sur salaire' | 'Prêt personnel' | 'Aide d\'urgence';
  amount: number;
  reason: string;
  date: string;
  statut: 'En attente' | 'Approuvé' | 'Rejeté' | 'En cours' | 'Terminé';
  repaymentDuration?: number;
  status?: 'En attente' | 'Approuvé' | 'Rejeté' | 'En cours' | 'Terminé';
}

export interface LoanStats {
  totalLoans: number;
  pendingApproval: number;
  activeLoans: number;
  totalAmount: number;
}
