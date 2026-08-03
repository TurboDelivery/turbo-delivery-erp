/**
 * Conserve le premier exemplaire de chaque ticket, dans l'ordre reçu.
 *
 * <p>Indispensable sur ces listes paginées dont les éléments <b>sortent</b> au fur et à
 * mesure : chaque ticket validé quitte la liste, les pages suivantes se décalent d'un rang, et
 * un ticket déjà chargé en page 1 réapparaît en page 2. Le doublon se voyait à l'écran (deux
 * cartes identiques, clés React en conflit) et surtout se validait deux fois — le second envoi
 * revenant en 409 « déjà validé », affiché en rouge à l'opérateur.</p>
 */
export function sansDoublons<T extends { commandeId: string }>(tickets: T[]): T[] {
  const vus = new Set<string>();
  return tickets.filter((ticket) => {
    if (vus.has(ticket.commandeId)) {
      return false;
    }
    vus.add(ticket.commandeId);
    return true;
  });
}
