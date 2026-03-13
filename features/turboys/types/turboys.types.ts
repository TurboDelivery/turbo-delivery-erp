export type TurboyType = 'INDEPENDANT' | 'JOURNALIER';

export interface ITurboy {
  id: string;
  nom: string;
  prenoms: string;
  telephone: string | null;
  avatarUrl: string | null;
  email: string | null;
  birthDay: string | null;
  gender: 'HOMME' | 'FEMME';
  numeroCni: string | null;
  habitation: string | null;
  immatriculation: string | null;
  matricule: string | null;
  deleted: boolean;
  type: TurboyType;
  cniUrlR: string | null;
  cniUrlV: string | null;
  status: number;
}

export interface ITurboyParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  typeLivreur?: TurboyType;
}