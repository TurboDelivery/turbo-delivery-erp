'use client';

import Link from 'next/link';
import React from 'react';

/**
 * Un lien qui a l'allure d'un bouton.
 *
 * <h3>Pourquoi ce composant existe</h3>
 * <p>Le `Button` de la v3 est un `<button>` : il ne prend pas de `href`. Pour un geste
 * qui NAVIGUE, on trouvait donc deux contournements dans le code, tous deux invalides :
 * un `<Link>` de Next imbriqué DANS un `Button` — soit `<a>` dans `<button>` — ou
 * l'inverse. Un élément interactif dans un autre élément interactif n'a pas de
 * comportement défini : les lecteurs d'écran annoncent un bouton dont le nom vient d'un
 * lien, et selon le navigateur le clic active l'un, l'autre, ou aucun des deux.</p>
 *
 * <p>Ici c'est un VRAI lien : un `<a href>` que Next route côté client, qu'on peut ouvrir
 * dans un nouvel onglet, copier, ou survoler pour voir sa destination — ce qu'un
 * comptable fait tous les jours pour ouvrir trois factures côte à côte. Il porte
 * simplement les classes du bouton de la bibliothèque, `button button--{taille}
 * button--{variante}`, telles que le `Button` lui-même les émet.</p>
 */
export function LienBouton({
  children,
  className,
  href,
  pleineLargeur,
  taille = 'md',
  variante = 'outline',
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
  pleineLargeur?: boolean;
  taille?: 'lg' | 'md' | 'sm';
  variante?: 'danger' | 'ghost' | 'outline' | 'primary' | 'secondary';
}) {
  return (
    <Link className={['button', `button--${taille}`, `button--${variante}`, pleineLargeur ? 'w-full' : '', className ?? ''].filter(Boolean).join(' ')} href={href}>
      {children}
    </Link>
  );
}

export default LienBouton;
