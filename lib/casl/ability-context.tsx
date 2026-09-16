'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { Derogation } from '@/src/privileges/privileges.action';
import { anonymousAbility, defineAbilityFor, normalizeRole, type AppAbility } from './ability';
import { indexerDerogations } from './derogations';

export const AbilityContext = createContext<AppAbility>(anonymousAbility);

/**
 * Les derogations d'affichage du role courant, indexees par chemin.
 *
 * <p>Elles se posent PAR-DESSUS la matrice du code : `true` ouvre un ecran que le code
 * refuse, `false` ferme un ecran que le code ouvre. Une carte vide — le cas par defaut —
 * laisse l'ERP se comporter exactement comme avant.</p>
 */
export const DerogationsContext = createContext<Record<string, boolean>>({});

/**
 * Les derogations du role courant, indexees par chemin.
 *
 * <p>A passer telle quelle a `canAccessRoute` et a `filterMenuByAbility`, qui l'attendent
 * sous cette forme. La carte est STABLE entre deux rendus : elle est memorisee par le
 * fournisseur, et peut donc servir de dependance a un `useMemo` sans le relancer a chaque
 * fois.</p>
 */
export function useDerogations(): Record<string, boolean> {
  return useContext(DerogationsContext);
}

interface AbilityProviderProps {
  children: ReactNode;
  role?: string | null;
  /** Toutes les derogations, tous roles confondus : le provider retient celles du role courant. */
  derogations?: Derogation[];
}

export function AbilityProvider({ children, derogations, role: roleProp }: AbilityProviderProps) {
  const { data: session } = useSession();
  const rawRole = roleProp ?? (session?.user?.role as unknown as string | { libelle?: string } | null | undefined);
  const role = normalizeRole(rawRole ?? null);

  const ability = useMemo(() => defineAbilityFor(role), [role]);

  const parChemin = useMemo(() => indexerDerogations(derogations, role), [derogations, role]);

  return (
    <AbilityContext.Provider value={ability}>
      <DerogationsContext.Provider value={parChemin}>{children}</DerogationsContext.Provider>
    </AbilityContext.Provider>
  );
}
