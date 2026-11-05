import { apiClientHttp } from '@/lib/api-client-http';
import type { ILigneAEnvoyer } from './import-tickets.utils';

/**
 * Les appels de l'import de tickets.
 *
 * <p>⚠ Chaque appel porte {@code service: 'backend'}. Sans lui, un 401 venant de
 * main-backend ne ferait pas échouer l'écran : il DÉCONNECTERAIT l'opérateur de tout
 * l'ERP. L'intercepteur ne distingue la session expirée de la route fermée que par ce
 * marqueur.</p>
 *
 * <p>{@code X-User-Id} n'est pas posé ici : l'intercepteur le pose depuis la session
 * pour tout appel qui n'en porte pas. C'est le seul élément d'identité dont dispose la
 * garde serveur, les routes {@code /api/erp/**} étant servies sans jeton.</p>
 */

const BASE = '/api/erp/bon-livraison/import';

/** Le statut de contrôle qu'une ligne recevra, tel que le serveur l'annonce. */
export type StatutControlePrevu =
  | 'PENDING'
  | 'TARDIF'
  | 'AUTHENTIFIE'
  | 'V1_VALIDE'
  | 'V2_VALIDE'
  | 'REJETE_FRAUDE';

export type EtatLigneImport = 'PRET' | 'BLOQUE' | 'ENREGISTRE';

/** Le verdict d'une ligne, rendu par le contrôle à blanc puis par l'enregistrement. */
export interface IVerdictImport {
  index: number;
  etat: EtatLigneImport;
  motif: string | null;
  statutPrevu: StatutControlePrevu | null;
  creneauDebut: string | null;
  creneauFin: string | null;
  commissionPrevue: number | null;
  alertes: string[];
  ticketId: string | null;
}

export interface ISyntheseImport {
  nbRecues: number;
  nbEnregistrees: number;
  nbEchouees: number;
  lignes: IVerdictImport[];
}

export interface IParametresImport {
  /** Nombre maximum de lignes dans UN appel d'enregistrement. */
  lignesMax: number;
}

/**
 * Le plafond vient du SERVEUR, jamais d'une constante d'écran.
 *
 * <p>L'ERP a déjà annoncé une limite de 500 là où le serveur en appliquait 50 : l'écran
 * disait à l'opérateur qu'il pouvait, le serveur refusait, et le conseil donné était de
 * découper le fichier à la main.</p>
 */
export async function lireParametresImportRequest(): Promise<IParametresImport> {
  return await apiClientHttp.request<IParametresImport>({
    endpoint: `${BASE}/parametres`,
    method: 'GET',
    service: 'backend',
  });
}

/** Le contrôle à blanc : un verdict par ligne, aucune écriture. */
export async function verifierLignesRequest(
  lignes: ILigneAEnvoyer[],
): Promise<IVerdictImport[]> {
  return await apiClientHttp.request<IVerdictImport[]>({
    data: lignes,
    endpoint: `${BASE}/verifier`,
    method: 'POST',
    service: 'backend',
    // Un contrôle porte sur plusieurs centaines de lignes et interroge la grille de
    // commission pour chacune : le délai par défaut de 30 s coupe les gros paquets.
    config: { timeout: 120000 },
  });
}

/** L'enregistrement d'UN paquet. Au plus `lignesMax` lignes. */
export async function enregistrerPaquetRequest(
  lignes: ILigneAEnvoyer[],
): Promise<ISyntheseImport> {
  return await apiClientHttp.request<ISyntheseImport>({
    data: lignes,
    endpoint: BASE,
    method: 'POST',
    service: 'backend',
    // Chaque ligne ouvre sa transaction, écrit le ticket, son journal et la facture du
    // partenaire. Cinquante lignes tiennent largement, mais pas en 30 s sur un serveur
    // chargé.
    config: { timeout: 120000 },
  });
}
