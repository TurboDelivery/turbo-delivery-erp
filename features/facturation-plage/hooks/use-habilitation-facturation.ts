'use client';

import { useSession } from 'next-auth/react';

import { normalizeRole } from '@/lib/casl/ability';

/**
 * Les rôles habilités au mode « Au choix à chaque facture » (§3.2).
 *
 * Le cahier dit de ce mode qu'il est « réservé aux rôles autorisés » sans les nommer.
 * Arbitrage rendu le 17/08/2026 : Comptable, DG, DGA et Admin. « Admin » se normalise
 * en DG côté front, il n'a donc pas à figurer ici.
 *
 * Pourquoi ce mode et pas les autres : les cinq autres cycles fixent la période à
 * l'avance. Celui-là laisse choisir, facture par facture, entre le créneau et une plage
 * libre, c'est-à-dire choisir soi-même la période facturée à un partenaire.
 */
const ROLES_HABILITES = ['COMPTABLE', 'DGA', 'DG'];

/**
 * Vrai si l'utilisateur courant peut choisir librement le mode de facturation d'un
 * partenaire configuré en « Au choix à chaque facture ».
 *
 * <p>Le serveur refuse de toute façon le passage en « Au choix » sans habilitation ; ce
 * hook sert à ne pas proposer une action qui serait rejetée.</p>
 */
export function usePeutChoisirModeFacturation(): boolean {
  const { data: session } = useSession();
  const role = normalizeRole(session?.user?.role as string | null | undefined);
  return role !== null && ROLES_HABILITES.includes(role);
}
