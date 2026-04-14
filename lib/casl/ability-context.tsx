'use client';

import { createContext, useMemo, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { anonymousAbility, defineAbilityFor, normalizeRole, type AppAbility } from './ability';

export const AbilityContext = createContext<AppAbility>(anonymousAbility);

interface AbilityProviderProps {
  children: ReactNode;
  role?: string | null;
}

export function AbilityProvider({ children, role: roleProp }: AbilityProviderProps) {
  const { data: session } = useSession();
  const rawRole = roleProp ?? (session?.user?.role as unknown as string | { libelle?: string } | null | undefined);

  const ability = useMemo(() => defineAbilityFor(normalizeRole(rawRole ?? null)), [rawRole]);

  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
}
