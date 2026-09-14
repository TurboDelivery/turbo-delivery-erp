'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import type { ITendanceRang } from '@/features/classement-partenaires/types/classement.types';

/** Une ligne du classement des livreurs. */
export interface LigneClassementLivreur {
  /** Porte les ex æquo : 1, 2, 2, 4. On l'affiche TEL QUEL, on ne renumérote pas. */
  rang: number;
  livreurId: string;
  nom: string | null;
  code: string | null;
  contrat: string | null;
  nbTickets: number;
  commission: number;
  prime: number;
  /** Commission + prime : ce que le livreur a gagné sur la semaine. */
  gain: number;
  /**
   * NUL quand aucun emploi du temps n'existe.
   *
   * <p>Le livreur n'a pas travaillé « zéro jour » : on ne sait pas. Il sort du classement
   * sur ce critère au lieu d'y figurer bon dernier.</p>
   */
  joursTravailles: number | null;
  tendance: ITendanceRang | null;
}

export interface ClassementLivreurs {
  annee: number;
  semaine: number;
  debut: string;
  fin: string;
  tri: string;
  sens: string;
  contrat: string | null;
  /** Les paramètres reçus puis écartés faute d'être lisibles. */
  parametresIgnores: string[];
  totaux: {
    nbLivreurs: number;
    nbAyantRoule: number;
    nbTickets: number;
    commission: number;
    prime: number;
    gain: number;
  };
  lignes: LigneClassementLivreur[];
  /** Vrai quand la semaine précédente n'a rien à comparer. */
  tendanceIndisponible: boolean;
}

/**
 * Le classement des livreurs sur une semaine.
 *
 * <p>Aucun paramètre n'est obligatoire et aucun ne rend 400 : le serveur arbitre et rend son
 * arbitrage dans `tri`, `sens` et `parametresIgnores`. C'est ce bloc qui nomme l'écran, pas
 * l'URL — un en-tête qui annonce un tri que le serveur n'a pas appliqué serait un mensonge
 * silencieux.</p>
 */
export async function getClassementLivreurs(params: {
  annee?: number;
  semaine?: number;
  tri?: string;
  sens?: string;
  contrat?: string;
}): Promise<ClassementLivreurs | null> {
  const query: Record<string, string> = {};
  if (params.annee != null && params.semaine != null) {
    query.annee = String(params.annee);
    query.semaine = String(params.semaine);
  }
  if (params.tri) query.tri = params.tri;
  if (params.sens) query.sens = params.sens;
  if (params.contrat) query.contrat = params.contrat;

  return apiClientHttp.request<ClassementLivreurs | null>({
    endpoint: '/api/erp/performance/classement',
    method: 'GET',
    service: 'backend',
    params: query,
  });
}
