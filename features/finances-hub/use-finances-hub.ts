'use client';

import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { useChargesFixesQuery } from '@/features/charges/queries/charges-fixes.query';
import { useChargesVariablesQuery } from '@/features/charges/queries/charges-variables.query';
import { useActionChargeFixeMutation } from '@/features/charges/queries/charge-fixe.mutation';
import { useActionChargeVariableMutation } from '@/features/charges/queries/charge-variable.mutation';
import { useModuleConfigQuery } from '@/features/finances-config';
import { useRentabiliteQuery } from '@/features/rentabilite';
import { IFinanceItem, mapChargeFixe, mapChargeVariable } from './finances-hub.utils';

type WorkflowAction = 'valider-dga' | 'approuver-dg' | 'rejeter-dga' | 'rejeter-dg' | 'decaisser';

/** D'où sort l'argent et par quel moyen : ne concerne que le décaissement. */
export interface ISortieTresorerie {
  compteTresorerie?: string;
  moyenPaiement?: string;
}

/**
 * Agrège charges fixes + variables (mappées en items unifiés) + config (seuil) + rentabilité.
 * Le filtrage période (debut/fin) + catégorie est fait CÔTÉ SERVEUR (mêmes params que la
 * page /finance/charges) — c'est ce qui fait que le sélecteur de mois s'applique au tableau.
 */
export function useFinancesHub(
  dateArret: string,
  debut?: string,
  fin?: string,
  categorieIds?: string[],
) {
  const { data: config } = useModuleConfigQuery();
  const seuil = config?.seuilDga ?? 0;
  const nbJours = config?.nbJoursMois ?? 30;
  // Les comptes proposés au décaissement sont ceux de Finance › Configuration : le serveur
  // refuse tout autre libellé. La fenêtre en proposait deux écrits en dur (« Caisse
  // physique », « Banque ») dont le second n'existait dans aucune configuration.
  const comptes = (config?.comptesTresorerie ?? []).map((c) => c.libelle?.trim()).filter((l): l is string => !!l);

  // Acteur réel des actions (visa/accord/décaissement) — enregistré dans
  // valide_par / approuve_par et exploité par « Mon historique ». On utilise
  // session.user.name (login), IDENTIQUE à la page de validation, pour que les
  // actions faites des deux côtés soient attribuées au même acteur.
  const { data: session } = useSession();
  const actor = session?.user?.name ?? 'Inconnu';

  const cat = categorieIds && categorieIds.length > 0 ? categorieIds : undefined;
  const fixesQ = useChargesFixesQuery({ page: 0, size: 500, debut, fin, categorieIds: cat } as any);
  const variablesQ = useChargesVariablesQuery({ page: 0, size: 500, debut, fin, categorieIds: cat } as any);
  const rentaQ = useRentabiliteQuery(dateArret);

  // Objets BRUTS (avant mapping unifié) — nécessaires pour ré-alimenter les modales
  // d'édition (AddChargeFixeModal / AddDepenseVariableModal attendent le type brut).
  const rawFixes: any[] = (fixesQ.data as any)?.content ?? [];
  const rawVariables: any[] = (variablesQ.data as any)?.content ?? [];
  const fixes: IFinanceItem[] = rawFixes.map(mapChargeFixe);
  const variables: IFinanceItem[] = rawVariables.map(mapChargeVariable);
  const items = [...fixes, ...variables];

  const actFixe = useActionChargeFixeMutation();
  const actVar = useActionChargeVariableMutation();
  const queryClient = useQueryClient();

  const runAction = async (item: IFinanceItem, action: WorkflowAction, commentaire?: string, sortie?: ISortieTresorerie) => {
    // Le compte et le moyen ne partent QUE pour un décaissement : un visa ou un accord
    // ne sort rien de la caisse, et le serveur ne les lirait pas.
    const dto = { commentaire, par: actor, ...(action === 'decaisser' ? sortie : undefined) };
    const res =
      item.type === 'fixe'
        ? await actFixe.mutateAsync({ id: item.id, action, dto } as any)
        : await actVar.mutateAsync({ id: item.id, action, dto } as any);

    // Un visa / accord / décaissement change les montants engagés et décaissés :
    // sans ça, seul le statut de la ligne bougeait — les compteurs d'onglets, les
    // KPI (dépenses cumulées, bon à payer, marge) et les graphiques restaient figés
    // jusqu'à un rechargement manuel de la page.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['rentabilite'] }),
      queryClient.invalidateQueries({ queryKey: ['depense'] }),
    ]);
    return res;
  };

  return {
    items,
    rawFixes,
    rawVariables,
    actor,
    seuil,
    nbJours,
    comptes,
    renta: rentaQ.data,
    isLoading: fixesQ.isLoading || variablesQ.isLoading,
    isError: fixesQ.isError || variablesQ.isError,
    isFetching: fixesQ.isFetching || variablesQ.isFetching,
    // les deux listes forment un seul tableau : on les relance ensemble depuis le bouton "Reessayer"
    refetch: () => Promise.all([fixesQ.refetch(), variablesQ.refetch()]),
    busy: actFixe.isPending || actVar.isPending,
    runAction,
  };
}
