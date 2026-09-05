'use client';

import React from 'react';

import { TitreSection } from '@/components/commons/TitreSection';
import { ChampMotDePasse, ChampTexte } from '@/components/commons/champs-formulaire';

/**
 * Le compte du partenaire — identifiant et mot de passe.
 *
 * <p>Ce composant existait en DEUX exemplaires identiques caractère pour caractère,
 * `ComptePartenaireSection` sous `create/` et `CompteSection` sous `edit/` : deux endroits
 * à corriger le jour où l'un des deux bougeait. Les deux formulaires montent le même.</p>
 */
interface ComptePartenaireSectionProps {
  onPasswordChange: (v: string) => void;
  onUsernameChange: (v: string) => void;
  password: string;
  username: string;
}

export function ComptePartenaireSection({
  onPasswordChange,
  onUsernameChange,
  password,
  username,
}: ComptePartenaireSectionProps) {
  return (
    <section>
      <TitreSection>Compte du partenaire</TitreSection>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChampTexte
          label="Nom utilisateur"
          onChange={onUsernameChange}
          placeholder="username_restaurant"
          valeur={username}
        />
        <ChampMotDePasse
          label="Mot de passe"
          onChange={onPasswordChange}
          valeur={password}
        />
      </div>
    </section>
  );
}

/** Nom historique de ce composant sur le formulaire d'édition. */
export const CompteSection = ComptePartenaireSection;
