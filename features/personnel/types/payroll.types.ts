export interface IPayroll {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  position: string;
  department: string;
  salaryBrut: number;
  totalDeductionsPending: number;
  totalDeductionsPaid: number;
  netToPay: number;
  statut: string;
  salary_status: 'PAID' | 'NOT_PAID';
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPayrollParams {
  month: string;
}

export interface IPayPayrollParams {
  employeeId: string;
  montant: number;
  mois: number;
  annee: number;
}

