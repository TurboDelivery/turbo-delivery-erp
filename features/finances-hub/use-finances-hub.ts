'use client';

import { useChargesFixesQuery } from '@/features/charges/queries/charges-fixes.query';
import { useChargesVariablesQuery } from '@/features/charges/queries/charges-variables.query';
import { useActionChargeFixeMutation } from '@/features/charges/queries/charge-fixe.mutation';
import { useActionChargeVariableMutation } from '@/features/charges/queries/charge-variable.mutation';
import { useModuleConfigQuery } from '@/features/finances-config';
import { useRentabiliteQuery } from '@/features/rentabilite';
import { IFinanceItem, mapChargeFixe, mapChargeVariable } from './finances-hub.utils';

type WorkflowAction = 'valider-dga' | 'approuver-dg' | 'rejeter-dga' | 'rejeter-dg' | 'decaisser';

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

  const cat = categorieIds && categorieIds.length > 0 ? categorieIds : undefined;
  const fixesQ = useChargesFixesQuery({ page: 0, size: 500, debut, fin, categorieIds: cat } as any);
  const variablesQ = useChargesVariablesQuery({ page: 0, size: 500, debut, fin, categorieIds: cat } as any);
  const rentaQ = useRentabiliteQuery(dateArret);

  const fixes: IFinanceItem[] = ((fixesQ.data as any)?.content ?? []).map(mapChargeFixe);
  const variables: IFinanceItem[] = ((variablesQ.data as any)?.content ?? []).map(mapChargeVariable);
  const items = [...fixes, ...variables];

  const actFixe = useActionChargeFixeMutation();
  const actVar = useActionChargeVariableMutation();

  const runAction = (item: IFinanceItem, action: WorkflowAction, commentaire?: string) => {
    if (item.type === 'fixe') {
      return actFixe.mutateAsync({ id: item.id, action, dto: { commentaire, par: 'Admin' } } as any);
    }
    return actVar.mutateAsync({ id: item.id, action, dto: { commentaire, par: 'Admin' } } as any);
  };

  return {
    items,
    seuil,
    nbJours,
    renta: rentaQ.data,
    isLoading: fixesQ.isLoading || variablesQ.isLoading,
    isError: fixesQ.isError || variablesQ.isError,
    busy: actFixe.isLoading || actVar.isLoading,
    runAction,
  };
}
