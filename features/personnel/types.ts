export interface Employee {
  id: string;
  name: string;
  email: string;
  function: string;
  department: string;
  salary: number;
  status: 'Actif' | 'Inactif' | 'Congé';
  entryDate: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'annuel' | 'maladie' | 'sans solde';
  startDate: string;
  endDate: string;
  duration: number;
  status: 'En cours' | 'Terminé' | 'En attente' | 'Approuvée' | 'Rejetée';
  reason?: string;
}

export interface Deduction {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Retard' | 'Absence injustifiée' | 'Dommage matériel' | 'Avance sur salaire';
  amount: number;
  reason: string;
  date: string;
  status: 'Appliquée' | 'En attente';
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
