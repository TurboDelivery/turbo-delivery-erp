// Configuration globale du module FINANCES (§4.1).

export type CaSource = 'AUTO' | 'MANUEL';
export type ModeTraitement = 'UNITE' | 'PANIER';
export type ValidationChargesFixes = 'MANUELLE' | 'AUTO';
export type TypeCompte = 'CAISSE' | 'BANQUE';

export interface ICompteTresorerie {
  libelle: string;
  type: TypeCompte;
}

export interface IModuleConfig {
  devise: string;
  nbJoursMois: number;
  caSource: CaSource;
  caReference: number | null;
  seuilDga: number;
  modeTraitement: ModeTraitement;
  clausePassageForce: boolean;
  jourGenerationAuto: number;
  validationChargesFixes: ValidationChargesFixes;
  comptesTresorerie: ICompteTresorerie[];
}

export type IUpdateModuleConfig = Partial<IModuleConfig>;
