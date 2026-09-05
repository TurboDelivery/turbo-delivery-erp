'use client';

import { AlertTriangle } from 'lucide-react';

import { VueFileAttente } from '@/features/file-attente/refonte/vue-file-attente';
import { useAbility } from '@/hooks/use-ability';

import { useFileAttenteVue } from './hooks/use-file-attente-vue';

/**
 * Écran FILE D'ATTENTE.
 *
 * <p>La conception et ses raisons sont documentées dans
 * `features/file-attente/refonte/vue-file-attente.tsx`, qui porte le rendu. Ce fichier ne
 * fait plus que la lecture et la garde d'autorisation.</p>
 */
export default function FileAttenteContent() {
  const ability = useAbility();
  const vue = useFileAttenteVue();

  if (!ability.can('read', 'Trafic')) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted">
        <AlertTriangle aria-hidden="true" className="size-8" />
        <p>Vous n&apos;avez pas accès au suivi des files d&apos;attente.</p>
      </div>
    );
  }

  return (
    <VueFileAttente
      isError={vue.isError}
      isFetching={vue.isFetching}
      isLoading={vue.isLoading}
      kpis={vue.kpis}
      maintenant={vue.maintenant}
      postes={vue.postes}
      rafraichir={vue.rafraichir}
      universeIncomplet={vue.universeIncomplet}
    />
  );
}
