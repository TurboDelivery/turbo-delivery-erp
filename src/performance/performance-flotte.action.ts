'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { PaginatedResponse } from '@/types';

const BASE_URL = '/api/erp/performance';

/**
 * La performance des livreurs d'un CONTRAT donné, sur une semaine choisie.
 *
 * <p>⚠ L'axe est celui du CONTRAT (`type_livreur` : journalier, indépendant, superviseur),
 * et non celui de l'ASSIGNATION (`type` : TURBO, FREE) que lisent les deux onglets
 * historiques. Ce sont deux colonnes différentes de la même table, et les deux populations
 * ne se recouvrent pas : un journalier peut être bird ou assigné.</p>
 *
 * <p>C'est l'axe que le cahier des charges « Performance de la Flotte » demande au §2.1, et
 * l'arbitrage de l'owner du 14/09 a écarté l'autre : le mode ASSIGNÉ/BIRD n'étant enregistré
 * nulle part, il n'est pas au programme.</p>
 *
 * <p>Mesure du 11/09 en production : les 191 livreurs portent tous un contrat, quand 61
 * n'ont pas de type d'assignation.</p>
 */
export async function getPerformanceParContrat(
  contrat: string,
  annee?: number,
  semaine?: number,
  size: number = 200,
  debut?: string | null,
  fin?: string | null,
): Promise<PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null> {
  return apiClientHttp.request<PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null>({
    endpoint: `${BASE_URL}/contrat/${contrat}`,
    method: 'GET',
    service: 'backend',
    params: {
      page: '0',
      size: String(size),
      /*
       * `debut`/`fin` l'emportent sur `annee`/`semaine`, exactement comme cote serveur
       * (`PeriodeLectureRecord.resoudre`). Deux ordres de priorite differents donneraient
       * un ecran qui affiche un libelle de periode et des chiffres qui ne s'y rapportent pas.
       *
       * Omis quand rien n'est precise : le serveur retombe alors sur la semaine en cours.
       */
      ...(debut && fin
        ? { debut, fin }
        : annee != null && semaine != null
          ? { annee: String(annee), semaine: String(semaine) }
          : {}),
    },
  });
  // Aucun catch : une panne de lecture doit remonter. Avalée, elle deviendrait une liste
  // vide, et l'écran annoncerait qu'aucun livreur n'a travaillé cette semaine-là.
}
