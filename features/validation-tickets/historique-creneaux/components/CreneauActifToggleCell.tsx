'use client';

import { useSession } from 'next-auth/react';
import { Chip, Switch } from '@heroui/react';
import { EyeOff } from 'lucide-react';
import { useSetCreneauActifMutation } from '@/features/creneaux/queries/creneau.query';
import type { ICreneauActifVm } from '@/features/creneaux/types/creneau.types';

/**
 * V59 (2026-05-29) — Cellule de bascule de visibilité d'un créneau, affichée
 * en colonne "Visible" dans le tableau Historique des créneaux. Remplace
 * l'ancienne modale "Gérer les créneaux" de la grille de paiement : la
 * gestion du drapeau {@code actif} se fait désormais inline, là où tous les
 * créneaux de validation sont déjà listés.
 *
 * <p>Masquer un créneau le retire des pickers UI sans toucher à l'historique
 * (tickets, lots et écritures conservés en base — seul {@code actif} change).
 * Un créneau dont {@code actif} est {@code undefined} (backend pré-V58) est
 * traité comme actif par rétro-compatibilité.</p>
 */
export default function CreneauActifToggleCell({ creneau }: { creneau: ICreneauActifVm }) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';
  const { mutate, isPending } = useSetCreneauActifMutation();

  const actif = creneau.actif !== false; // undefined ≡ actif (rétro-compat pré-V58)

  return (
    <div className="flex items-center gap-2">
      <Switch
        size="sm"
        isSelected={actif}
        isDisabled={isPending || !userId}
        onValueChange={() => {
          if (userId) mutate({ creneauId: creneau.id, actif: !actif, userId });
        }}
        aria-label={`${actif ? 'Masquer' : 'Réafficher'} le créneau ${creneau.label}`}
      />
      {!actif && (
        <Chip size="sm" variant="flat" color="warning" startContent={<EyeOff className="w-3 h-3" />}>
          Masqué
        </Chip>
      )}
    </div>
  );
}
