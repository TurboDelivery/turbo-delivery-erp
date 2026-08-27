'use client';

import { Chip } from '@/components/heroui';

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

/** Pastilles partagées par les onglets et la fiche agent. */

export function TypeContratChip({ type }: { type: string | null | undefined }) {
  return (
    <Chip size="sm" variant="flat" color={couleurTypeCollaborateur(type)} className="font-medium">
      {libelleTypeCollaborateur(type)}
    </Chip>
  );
}

export function StatutEffectifChip({ actif, sortieLe }: { actif: boolean; sortieLe?: string | null }) {
  if (actif) {
    return (
      <Chip size="sm" variant="dot" color="success">
        Actif
      </Chip>
    );
  }
  return (
    <Chip size="sm" variant="dot" color="default" className="text-default-500">
      {sortieLe ? `Sorti le ${formaterDate(sortieLe)}` : 'Sorti de l’effectif'}
    </Chip>
  );
}

export function DeclarationChip({ etat }: { etat: EtatDeclaration }) {
  if (etat === 'NON_APPLICABLE') {
    return <span className="text-xs text-default-400">{LIBELLE_DECLARATION.NON_APPLICABLE}</span>;
  }
  return (
    <Chip size="sm" variant="flat" color={COULEUR_DECLARATION[etat]}>
      {LIBELLE_DECLARATION[etat]}
    </Chip>
  );
}

export function GraviteChip({ gravite }: { gravite: string }) {
  return (
    <Chip size="sm" variant="flat" color={COULEUR_GRAVITE[gravite] ?? 'default'}>
      {LIBELLE_GRAVITE[gravite] ?? gravite}
    </Chip>
  );
}

export function EtatMoisChip({ statut }: { statut: string | null | undefined }) {
  const cloture = (statut ?? '').toUpperCase() === 'CLOTURE';
  return (
    <Chip size="sm" variant="flat" color={cloture ? 'success' : 'warning'}>
      {cloture ? 'Clôturé — figé' : 'Brouillon'}
    </Chip>
  );
}
