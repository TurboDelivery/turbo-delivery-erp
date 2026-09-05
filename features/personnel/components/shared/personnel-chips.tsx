'use client';

import { Chip } from '@heroui-v3/react';

import { EtatDeclaration } from '@/features/personnel/types/personnel-historisation.types';
import {
  COULEUR_DECLARATION,
  COULEUR_GRAVITE,
  LIBELLE_DECLARATION,
  LIBELLE_GRAVITE,
  couleurTypeCollaborateur,
  formaterDate,
  libelleTypeCollaborateur,
} from '@/features/personnel/utils/personnel-historisation.utils';

/**
 * Pastilles partagées par les onglets et la fiche agent.
 *
 * <p>Les variantes `flat` et `dot` de la v2 n'existent plus : `variant` porte désormais
 * l'INTENSITÉ (`primary`, `tertiary`, `soft`) et `color` le SENS. Une prop v2 laissée en
 * place serait silencieusement ignorée, et la pastille rendue en gris neutre — c'est
 * exactement l'état de déclaration qui aurait disparu.</p>
 */

export function TypeContratChip({ type }: { type: string | null | undefined }) {
  return (
    <Chip color={couleurTypeCollaborateur()} size="sm" variant="soft">
      <Chip.Label className="font-medium">{libelleTypeCollaborateur(type)}</Chip.Label>
    </Chip>
  );
}

export function StatutEffectifChip({
  actif,
  sortieLe,
}: {
  actif: boolean;
  sortieLe?: string | null;
}) {
  return (
    <Chip color={actif ? 'success' : 'default'} size="sm" variant="soft">
      <Chip.Label>
        {actif ? 'Actif' : sortieLe ? `Sorti le ${formaterDate(sortieLe)}` : 'Sorti de l’effectif'}
      </Chip.Label>
    </Chip>
  );
}

export function DeclarationChip({ etat }: { etat: EtatDeclaration }) {
  if (etat === 'NON_APPLICABLE') {
    return <span className="text-xs text-muted">{LIBELLE_DECLARATION.NON_APPLICABLE}</span>;
  }
  return (
    <Chip color={COULEUR_DECLARATION[etat]} size="sm" variant="soft">
      <Chip.Label>{LIBELLE_DECLARATION[etat]}</Chip.Label>
    </Chip>
  );
}

export function GraviteChip({ gravite }: { gravite: string }) {
  return (
    <Chip color={COULEUR_GRAVITE[gravite] ?? 'default'} size="sm" variant="soft">
      <Chip.Label>{LIBELLE_GRAVITE[gravite] ?? gravite}</Chip.Label>
    </Chip>
  );
}

export function EtatMoisChip({ statut }: { statut: string | null | undefined }) {
  const cloture = (statut ?? '').toUpperCase() === 'CLOTURE';
  /*
   * Un mois en brouillon n'est pas un avertissement : c'est l'etat NORMAL d'un mois en
   * cours. L'ambre y disait un probleme qui n'existait pas.
   */
  return (
    <Chip color={cloture ? 'success' : 'default'} size="sm" variant="soft">
      <Chip.Label>{cloture ? 'Clôturé — figé' : 'Brouillon'}</Chip.Label>
    </Chip>
  );
}
