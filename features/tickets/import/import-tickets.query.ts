'use client';

import { useQueries, useQuery } from '@tanstack/react-query';

import { getPriceListByRestaurant } from '@/src/price-list/price-list.action';
import { lireParametresImportRequest } from './import-tickets.request';
import type { IZoneGrille } from './import-tickets.utils';

export const importTicketsKeys = {
  all: ['import-tickets'] as const,
  grille: (restaurantId: string) => [...importTicketsKeys.all, 'grille', restaurantId] as const,
  parametres: () => [...importTicketsKeys.all, 'parametres'] as const,
};

/**
 * Le plafond de lignes par paquet, lu sur le serveur.
 *
 * <p>Sans réponse, l'écran ne découpe pas au hasard : il attend. Deviner un plafond
 * ferait refuser le premier paquet par le serveur, et l'opérateur n'aurait aucun moyen
 * de comprendre pourquoi.</p>
 */
export function useParametresImportQuery() {
  return useQuery({
    queryFn: lireParametresImportRequest,
    queryKey: importTicketsKeys.parametres(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Toutes les zones des partenaires présents dans le fichier.
 *
 * <p>Aucun endpoint ne rend la grille de plusieurs partenaires d'un coup : c'est un
 * appel par partenaire. Un fichier en porte quelques dizaines au plus, et TanStack les
 * met en cache, donc revenir en arrière dans l'écran ne les redemande pas.</p>
 *
 * <p>⚠ La taille de page vaut 200 et non la valeur par défaut de 10. Le défaut
 * tronquerait la grille sans le dire, et la zone manquante se lirait comme « aucune
 * zone à ce prix » : l'opérateur en conclurait que sa ligne est fausse alors que la
 * lecture est incomplète. Le plus gros partenaire porte aujourd'hui une trentaine de
 * zones, sur 792 au total pour 80 partenaires.</p>
 */
export function useGrillesZonesQueries(restaurantIds: string[]) {
  return useQueries({
    combine: (resultats) => {
      const grilles: Record<string, IZoneGrille[]> = {};
      resultats.forEach((resultat, i) => {
        const contenu = resultat.data?.content;
        if (!contenu) return;
        grilles[restaurantIds[i]] = contenu
          .filter((zone) => Boolean(zone.id))
          .map((zone) => ({
            commission: Number(zone.commission ?? 0),
            id: String(zone.id),
            nom: zone.name ?? zone.zone ?? 'Zone sans nom',
            prix: Number(zone.prix ?? 0),
            /*
             * Le seuil n'est PAS servi par cet endpoint : `DeliveryFee` ne le porte pas,
             * alors que l'entité serveur l'a. « Le choix de zone ne change pas le
             * montant » se décide donc sur la seule commission.
             *
             * <p>Mesuré en production avant d'écrire ceci : sur les 98 couples
             * (partenaire, prix) dont plusieurs zones partagent le prix, comparer la
             * commission seule et comparer la commission ET le seuil donnent exactement
             * le même partage, 95 sans effet contre 3 avec. Aucune zone ne porte
             * aujourd'hui un seuil qui la distingue d'une voisine de même prix. Si cela
             * changeait, c'est ici que la lecture deviendrait trop optimiste, et il
             * faudrait servir le seuil.</p>
             */
            seuilCommission: null,
          }));
      });
      return {
        enAttente: resultats.some((r) => r.isPending),
        enEchec: resultats.filter((r) => r.isError).length,
        grilles,
      };
    },
    queries: restaurantIds.map((restaurantId) => ({
      queryFn: () => getPriceListByRestaurant(restaurantId, 0, 200),
      queryKey: importTicketsKeys.grille(restaurantId),
      staleTime: 5 * 60 * 1000,
    })),
  });
}
