export interface IPicture {
  id: string;
  pictureUrl: string;
  description?: string;
}

export interface IOpeningHour {
  id: string;
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
  closed: boolean;
}

export type MethodRecouvrementType = 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'QUINZAINE' | 'MENSUEL';

export interface IRestaurant {
  id: string;
  status: number;
  deleted: boolean;
  dateCreation: string;
  dateEdition: string;
  nomEtablissement: string;
  description: string;
  email: string;
  telephone: string;
  codePostal: string;
  commune: string;
  localisation: string;
  siteWeb: string | null;
  logo: string;
  logo_Url: string;
  dateService: string;
  documentUrl: string;
  cni: string;
  longitude: number | null;
  latitude: number | null;
  idLocation: string | null;
  pictures: IPicture[];
  openingHours: IOpeningHour[];
  position?: {
    longitude: number;
    latitude: number;
  };
  typeCommission: string;
  commission: number;
  methodRecouvrement: MethodRecouvrementType;
}

export interface IRestaurantParams {
  page?: number;
  limit?: number;
  search?: string;
  nomEtablissement?: string;
  localisation?: string;
  email?: string;
  telephone?: string;
  commune?: string;
  methodRecouvrement?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

