export interface Picture {
  id: string;
  url: string;
  description?: string;
}

export interface OpeningHour {
  id: string;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Restaurant {
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
  pictures: Picture[];
  openingHours: OpeningHour[];
  position?: {
    longitude: number;
    latitude: number;
  };
  typeCommission: string;
  commission: number;
  methodRecouvrement: string;
}

export interface IRestaurantParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

