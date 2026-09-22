'use client';

import { useSession } from 'next-auth/react';

/**
 * Les trois profils autorisés à toucher aux registres qui retirent de l'argent des
 * encours : pertes et vols, déductions et avances.
 */
const PROFILS_DIRECTION = ['ADMIN', 'DGA', 'DG'];

/**
 * Le rôle de la session, quelle que soit la forme sous laquelle il arrive.
 *
 * <p>Le profil remonte tantôt en chaîne (« DG »), tantôt en objet porteur d'un
 * `libelle`. Lire une seule des deux formes rendait `''` pour l'autre, donc un refus
 * silencieux pour des comptes légitimes.</p>
 */
export function useRoleSession(): string {
  const { data: session } = useSession();
  const brut = session?.user?.role as unknown;
  if (typeof brut === 'string') return brut.toUpperCase();
  if (brut && typeof brut === 'object' && 'libelle' in brut) {
    return String((brut as { libelle?: string }).libelle ?? '').toUpperCase();
  }
  return '';
}

/**
 * Ce compte peut-il corriger ou supprimer une ligne de ces registres ?
 *
 * <p>⚠ Ceci masque des boutons, ça ne ferme pas une porte. Les routes concernées
 * répondent sans jeton tant que le RBAC du backend n'est pas rebranché — l'intercepteur
 * de rôles y est commenté. Le seul verrou réel aujourd'hui est le code de validation de
 * la Direction, exigé par le serveur sur chacune de ces écritures.</p>
 */
export function usePeutDeciderEncours(): boolean {
  return PROFILS_DIRECTION.includes(useRoleSession());
}
