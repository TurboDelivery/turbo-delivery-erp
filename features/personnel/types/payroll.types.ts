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
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPayrollParams {
  month: number;
}

