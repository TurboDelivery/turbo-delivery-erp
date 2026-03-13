import { Employee, LeaveRequest, Deduction, Department, Function, LeaveStats, RequestStats, DeductionStats } from './types';

export const mockDepartments: Department[] = [
  { id: '1', name: 'Livraison' },
  { id: '2', name: 'Administration' },
  { id: '3', name: 'Finance' },
  { id: '4', name: 'Technique' },
  { id: '5', name: 'Ressources Humaines' }
];

export const mockFunctions: Function[] = [
  { id: '1', name: 'Superviseur' },
  { id: '2', name: 'Directeur Général' },
  { id: '3', name: 'Livreur' },
  { id: '4', name: 'Comptable' },
  { id: '5', name: 'Développeur' },
  { id: '6', name: 'Assistant' }
];

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'AA AFYA ABDELLATIF',
    email: 'a.abdellatif@turbo.com',
    function: 'Superviseur',
    department: 'Livraison',
    salary: 200000,
    status: 'Actif',
    entryDate: '10/09/2022'
  },
  {
    id: '2',
    name: 'A ALBERT',
    email: 'albert@turbo.com',
    function: 'Superviseur',
    department: 'Livraison',
    salary: 160000,
    status: 'Congé',
    entryDate: '08/05/2023'
  },
  {
    id: '3',
    name: 'ASSAH DOSSOU CEDRIC',
    email: 'assah@turbo.com',
    function: 'Directeur Général',
    department: 'Administration',
    salary: 700000,
    status: 'Actif',
    entryDate: '12/06/2023'
  },
  {
    id: '4',
    name: 'MARIE DUPONT',
    email: 'marie.dupont@turbo.com',
    function: 'Comptable',
    department: 'Finance',
    salary: 250000,
    status: 'Actif',
    entryDate: '15/01/2023'
  },
  {
    id: '5',
    name: 'JEAN MARTIN',
    email: 'jean.martin@turbo.com',
    function: 'Livreur',
    department: 'Livraison',
    salary: 120000,
    status: 'Inactif',
    entryDate: '20/03/2023'
  }
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    employeeId: '2',
    employeeName: 'A ALBERT',
    type: 'annuel',
    startDate: '01/12/2024',
    endDate: '15/12/2024',
    duration: 15,
    status: 'En cours',
    reason: 'Vacances familiales'
  },
  {
    id: '2',
    employeeId: '1',
    employeeName: 'AA AFYA ABDELLATIF',
    type: 'maladie',
    startDate: '10/11/2024',
    endDate: '12/11/2024',
    duration: 3,
    status: 'Terminé',
    reason: 'Grippe'
  },
  {
    id: '3',
    employeeId: '4',
    employeeName: 'MARIE DUPONT',
    type: 'sans solde',
    startDate: '20/12/2024',
    endDate: '22/12/2024',
    duration: 3,
    status: 'En attente',
    reason: 'Raison personnelle'
  }
];

export const mockDeductions: Deduction[] = [
  {
    id: '1',
    employeeId: '5',
    employeeName: 'JEAN MARTIN',
    type: 'Retard',
    amount: 5000,
    reason: 'Retard répété ce mois',
    date: '05/12/2024',
    status: 'Appliquée'
  },
  {
    id: '2',
    employeeId: '3',
    employeeName: 'ASSAH DOSSOU CEDRIC',
    type: 'Avance sur salaire',
    amount: 200000,
    reason: 'Avance pour frais médicaux',
    date: '10/12/2024',
    status: 'En attente',
    repaymentDuration: 6
  },
  {
    id: '3',
    employeeId: '1',
    employeeName: 'AA AFYA ABDELLATIF',
    type: 'Dommage matériel',
    amount: 50000,
    reason: 'Réparation véhicule suite à incident',
    date: '12/12/2024',
    status: 'En attente'
  }
];

export const mockLeaveStats: LeaveStats = {
  currentlyOnLeave: 1,
  takenThisMonth: 18,
  completedLeaves: 12
};

export const mockRequestStats: RequestStats = {
  pending: 1,
  approved: 8,
  rejected: 2
};

export const mockDeductionStats: DeductionStats = {
  totalThisMonth: 255000,
  pendingValidation: 250000
};
