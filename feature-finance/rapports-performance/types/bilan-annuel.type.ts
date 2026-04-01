export interface IBilanAnnuelParams {
  annee: string;
}

export interface IMonthStats {
  c_a: number;
  depenses: number;
  benefices: number;
  remboursement: number;
  course_externes: number;
  investissements: number;
  nombre_employees: number;
  benefices_cumulees: number;
}

// Les clés de mois renvoyées par le backend
export type MonthKey =
  | 'jan'
  | 'feb'
  | 'mar'
  | 'apr'
  | 'may'
  | 'jun'
  | 'jul'
  | 'aug'
  | 'sep'
  | 'oct'
  | 'nov'
  | 'dec';

export type IBilanAnnuelResponse = {
  [year: string]: {
    [key in MonthKey]: IMonthStats;
  };
};
