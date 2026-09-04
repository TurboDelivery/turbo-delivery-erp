'use client';

import { useSession } from 'next-auth/react';
import { Chip, Switch } from '@heroui-v3/react';
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
      {/*
       * L'interrupteur est compose en v3 : la piste et la pastille sont des enfants
       * explicites. Sans elles, `Switch` ne dessine rien et la colonne "Visible"
       * apparait vide, alors que la bascule reste cliquable au clavier.
       *
       * Le rappel s'appelle `onChange` et non `onValueChange` : la prop v2 aurait ete
       * ignoree sans erreur, et masquer un creneau n'aurait plus rien envoye au backend.
       */}
      <Switch
        size="sm"
        isSelected={actif}
        isDisabled={isPending || !userId}
        onChange={(nextActif) => {
          if (userId) mutate({ creneauId: creneau.id, actif: nextActif, userId });
        }}
        aria-label={`${actif ? 'Masquer' : 'Réafficher'} le créneau ${creneau.label}`}
      >
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
      {!actif && (
        <Chip size="sm" variant="soft" color="warning">
          <EyeOff className="w-3 h-3" />
          <Chip.Label>Masqué</Chip.Label>
        </Chip>
      )}
    </div>
  );
}
