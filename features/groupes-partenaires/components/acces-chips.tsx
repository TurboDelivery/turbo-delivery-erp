'use client';

import { Chip } from '@heroui/react';

import {
  EffetSurCompte,
  PORTEE_ACCES_LABELS,
  ROLE_PARTENAIRE_LABELS,
} from '../types/groupes-partenaires.types';

/** Rôle du compte sur son périmètre. Le code brut reste affiché s'il est inconnu du front. */
export function RoleChip({ role, size = 'sm' }: { role: string | null; size?: 'sm' | 'md' }) {
  if (!role) return <span className="text-default-400">—</span>;
  return (
    <Chip size={size} variant="flat" color={role === 'OWNER' || role === 'ADMIN' ? 'primary' : 'default'}>
      {ROLE_PARTENAIRE_LABELS[role] ?? role}
    </Chip>
  );
}

/** Étendue de l'accès : tout le groupe, ou un seul établissement. */
export function PorteeChip({ portee }: { portee: string }) {
  const groupe = portee === 'GROUPE';
  return (
    <Chip size="sm" variant="dot" color={groupe ? 'secondary' : 'default'}>
      {PORTEE_ACCES_LABELS[portee] ?? portee}
    </Chip>
  );
}

const EFFET_STYLE: Record<EffetSurCompte, { libelle: string; couleur: 'primary' | 'success' | 'default' | 'danger' }> = {
  DEVIENT_PRINCIPAL: { libelle: 'Devient compte principal', couleur: 'primary' },
  GAGNE: { libelle: 'Accès élargi', couleur: 'success' },
  INCHANGE: { libelle: 'Inchangé', couleur: 'default' },
  PERD: { libelle: 'Accès retiré', couleur: 'danger' },
};

export function EffetChip({ effet }: { effet: EffetSurCompte }) {
  const style = EFFET_STYLE[effet];
  return (
    <Chip size="sm" variant="flat" color={style.couleur}>
      {style.libelle}
    </Chip>
  );
}
