import React from 'react';

/**
 * Le titre d'une section de formulaire.
 *
 * <p>Il était redéfini à l'identique dans SIX fichiers — création de coursier, création et
 * édition de partenaire, et trois sections de partenaire —, cinq d'entre eux en
 * `text-primary`, la couleur de MARQUE. Un titre de section n'est pas un appel à l'action :
 * il structure la lecture, et c'est sa graisse qui le fait, pas sa teinte. Le sixième, sur
 * la fiche coursier, l'avait déjà corrigé.</p>
 */
export function TitreSection({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-base font-semibold text-foreground">{children}</h2>;
}

export default TitreSection;
