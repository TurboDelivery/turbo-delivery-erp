'use server';

import { apiClientHttp } from '@/lib/api-client-http';

/** Un créneau de paie, tel que la liste des créneaux le rend. */
export interface CreneauPaie {
  id: string;
  label: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
}

/**
 * Les totaux d'un créneau de paie.
 *
 * <p>Ce sont EXACTEMENT les grandeurs que le cahier des charges « Performance de la Flotte »
 * demande au tableau 3, et il dit lui-même d'où elles doivent venir (§4.1) : « l'onglet
 * Récapitulatif montre le format de synthèse déjà attendu par la Direction : il doit servir
 * de base au bandeau de statistiques globales décrit en section 3.1, en le rendant dynamique
 * et filtrable au lieu d'un export figé par créneau ».</p>
 */
export interface StatsCreneau {
  totalLivreurs: number;
  totalTickets: number;
  totalBrut: number;
  totalNet: number;
  totalAPayer: number;
  waveManquants: number;
  nbJournaliers: number;
  nbIndependants: number;
  nbSuperviseurs: number;
  nbACategoriser: number;
  dontJournaliers: number;
  dontIndependants: number;
  dontSuperviseurs: number;
  dontACategoriser: number;
}

/**
 * Le créneau de paie dont la semaine commence ce lundi-là.
 *
 * <p>⚠ Un créneau de paie et un emploi du temps sont DEUX OBJETS DIFFÉRENTS, et c'est un
 * piège connu de ce projet. Le créneau est la semaine du circuit de paie, avec son
 * verrouillage ; l'emploi du temps est le programme d'un livreur. Ils portent tous deux le
 * mot « semaine » et ne se recoupent pas.</p>
 *
 * <p>Le rapprochement se fait sur la DATE DE DÉBUT, seule donnée commune et vérifiable. Rien
 * n'est rendu quand aucun créneau ne commence ce jour-là : le bandeau se tait alors, plutôt
 * que d'afficher les totaux d'une autre semaine.</p>
 */
export async function getCreneauDuLundi(lundi: string): Promise<CreneauPaie | null> {
  const page = await apiClientHttp.request<{ content: CreneauPaie[] } | null>({
    endpoint: '/api/creneaux',
    method: 'GET',
    service: 'backend',
    params: { page: '0', size: '60' },
  });

  return page?.content?.find((c) => c.dateDebut === lundi) ?? null;
}

/** Les totaux d'un créneau. `null` quand la lecture échoue : le bandeau se tait. */
export async function getStatsCreneau(creneauId: string): Promise<StatsCreneau | null> {
  const grille = await apiClientHttp.request<{ stats: StatsCreneau } | null>({
    endpoint: `/api/creneaux/${creneauId}/grille-paiement`,
    method: 'GET',
    service: 'backend',
  });

  return grille?.stats ?? null;
}
