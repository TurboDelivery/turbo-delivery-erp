export enum UtilisateurRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  AGENT = "AGENT",
  EDITOR = "EDITOR",
  CUSTOMER = "CUSTOMER",
}

export interface IUtilisateur {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: UtilisateurRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: [string, string][];
}

export interface IUtilisateursParams {
  userType?: 'internal' | 'customer';
  page?: number;
  limit?: number;
}

export interface IUtilisateurAddUpdateResponse extends Pick<IUtilisateur,
  'id' | 'email' | 'firstName' | 'lastName' | 'phone' | 'role' | 'isActive'
  | 'createdAt' | 'updatedAt'> {
  generatedPassword?: string
}

export interface IUtilisateurDeleteResponse {
  success: true;
  message: string;
}