'use client';

import { Chip } from '@heroui-v3/react';

import {
  EffetSurCompte,
  PORTEE_ACCES_LABELS,
  ROLE_PARTENAIRE_LABELS,
} from '../types/groupes-partenaires.types';

/**
 * Les pastilles du volet Groupes.
 *
 * <p>Le RÔLE d'un compte et la PORTÉE de son accès sont des catégories : elles étaient
 * peintes en `primary` — la couleur de marque — et `secondary`, deux teintes qui n'ont
 * plus de sens sémantique en v3 (`variant` y porte l'intensité, `color` le sens). Le
 * libellé dit déjà lequel c'est.</p>
 *
 * <p>L'EFFET d'une opération sur un compte, lui, garde sa couleur : c'est ce que
 * l'écran promet de montrer avant validation — qui gagne un accès, qui en perd un.</p>
 */

/** Rôle du compte sur son périmètre. Le code brut reste affiché s'il est inconnu du front. */
export function RoleChip({ role, size = 'sm' }: { role: null | string; size?: 'md' | 'sm' }) {
  if (!role) return <span className="text-muted">—</span>;
  return (
    <Chip size={size} variant="soft">
      <Chip.Label className="whitespace-nowrap">{ROLE_PARTENAIRE_LABELS[role] ?? role}</Chip.Label>
    </Chip>
  );
}

/** Étendue de l'accès : tout le groupe, ou un seul établissement. */
export function PorteeChip({ portee }: { portee: string }) {
  return (
    <Chip size="sm" variant="soft">
      <Chip.Label className="whitespace-nowrap">
        {PORTEE_ACCES_LABELS[portee] ?? portee}
      </Chip.Label>
    </Chip>
  );
}

const EFFET_STYLE: Record<
  EffetSurCompte,
  { couleur: 'danger' | 'default' | 'success'; libelle: string }
> = {
  DEVIENT_PRINCIPAL: { couleur: 'success', libelle: 'Devient compte principal' },
  GAGNE: { couleur: 'success', libelle: 'Accès élargi' },
  INCHANGE: { couleur: 'default', libelle: 'Inchangé' },
  PERD: { couleur: 'danger', libelle: 'Accès retiré' },
};

export function EffetChip({ effet }: { effet: EffetSurCompte }) {
  const style = EFFET_STYLE[effet];
  return (
    <Chip color={style.couleur} size="sm" variant="soft">
      <Chip.Label className="whitespace-nowrap">{style.libelle}</Chip.Label>
    </Chip>
  );
}
