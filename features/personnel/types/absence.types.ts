import { IEmployee } from '@/features/personnel/types/types';

export enum AbsenceTypeEnum {
  ABSENCE = 'ABSENCE',
  RETARD = 'RETARD'
}

export interface IAbsence {
  id?: string;
  employeeId?: string;
  employee: IEmployee
  dateDebut: Date | string;
  dateFin: Date | string;
  motif: string;
  type: AbsenceTypeEnum;
}

export interface IAbsencePayload {
  employeeId: string;
  dateDebut: string;
  dateFin: string;
  motif: string;
  type: AbsenceTypeEnum;
}

export interface IAbsenceParams {
  page?: number;
  size?: number;
  sort?: string;
  employeeId?: string;
  type?: AbsenceTypeEnum | '';
  periodeDebut?: string;
  periodeFin?: string;
}
