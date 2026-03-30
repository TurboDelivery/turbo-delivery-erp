import { IEmployee } from '@/features/personnel/types/types';

export type ISODateString = string; // Format attendu: yyyy-MM-dd

export enum DeductionTypeEnum {
  AVANCE = 'AVANCE',
  PRET = 'PRET',
  ABSENCE = 'ABSENCE',
  RETARD = 'RETARD',
}

export enum DeductionStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export interface IDeduction {
  id: string;
  typeDeduction: DeductionTypeEnum;
  amount: number;
  deductionDate: ISODateString;
  payrollMonth: ISODateString;
  referenceId?: string | null;
  description?: string | null;
  status: DeductionStatusEnum;
  employee: IEmployee;
}

export interface IDeductionParams {
  page?: number;
  size?: number;
  sort?: string;
  employeeId?: string;
  year?: number;
  month?: number;
  typeDeduction?: DeductionTypeEnum | '';
  status?: DeductionStatusEnum | '';
  deductionDateStart?: string;
  deductionDateEnd?: string;
}


export type ICreatePretResponse = IDeduction[];
export type ICreateAvanceResponse = IDeduction;
export type ICreateAbsenceDeductionResponse = IDeduction;

export interface IDeductionStats {
  masseBrute: number;
  totalDeductions: number;
  pendingDeductions: number;
}
