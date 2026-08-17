import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const ticketsV2KeyQuery = (...params: any[]) => {
  if (params.length === 0) return ['tickets-v2'];
  return ['tickets-v2', ...params];
};

// 2- Hook d'invalidation
export const useInvalidateTicketsV2Query = () => {
  const queryClient = useQueryClient();

  return async (..._params: any[]) => {
    // UNE seule invalidation, sur la racine de la clé.
    //
    // Il y en avait deux : une invalidation sur la clé affinée, puis un refetch de
    // toute la racine — les deux attendus. `invalidateQueries` rechargeant déjà les
    // requêtes actives, le second passage refaisait à l'identique tout ce que le
    // premier venait de faire. L'écran porte trois listes à défilement infini plus
    // les statistiques, et une liste infinie recharge TOUTES ses pages déjà
    // chargées : le bouton restait bloqué sur le double de cet aller-retour.
    //
    // La racine est conservée volontairement : les trois listes vivent sous la même
    // clé, valider un ticket le fait passer de l'une à l'autre.
    await queryClient.invalidateQueries({
      queryKey: ticketsV2KeyQuery(),
      exact: false,
    });
  };
};
