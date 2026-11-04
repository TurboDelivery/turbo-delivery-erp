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
/**
 * Ce qu'une catégorie de contrat pèse dans le créneau, vu par la GRILLE DE PAIE.
 *
 * <p>Les trois cartes de l'écran d'entrée lisaient `/api/erp/performance/contrat/{X}`, qui
 * recompte les courses par date, en direct. Leurs chiffres bougeaient donc après la clôture
 * alors que le bandeau juste au-dessus, lui, tenait : supprimer un ticket d'une semaine
 * verrouillée faisait baisser les cartes et pas le bandeau. Une seule source désormais,
 * celle de la paie.</p>
 */
export interface SyntheseContratPaie {
  /** `JOURNALIER`, `INDEPENDANT`, `SUPERVISEUR_LIVREUR` ou `A_CATEGORISER`. */
  contrat: string;
  livreurs: number;
  programmes: number;
  tickets: number;
  brut: number;
  commission: number;
  prime: number;
  net: number;
}

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
  /** Absent d'un backend qui ne le rend pas encore : les cartes retombent alors sur le calcul vivant. */
  parContrat?: SyntheseContratPaie[] | null;
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
    /*
     * `debut` fait trancher le SERVEUR, et c'est la moitie de la lenteur de cet ecran :
     * chaque ligne de cette liste porte ses agregats (lots, lignes de lot, tickets), 2,2 a
     * 2,5 s pour l'ensemble, et on en jetait toutes sauf une.
     *
     * ⚠ `size` reste large et le `find` ci-dessous est CONSERVE. Un backend qui ne connait
     * pas encore `debut` ignore le parametre en silence et rend sa premiere page : demander
     * `size=1` rendrait alors le creneau le plus RECENT, et toute semaine passee se lirait
     * « aucun creneau ». L'ecran doit survivre a l'ordre de deploiement, pas le supposer.
     */
    params: { page: '0', size: '60', debut: lundi },
  });

  return page?.content?.find((c) => c.dateDebut === lundi) ?? null;
}

/**
 * Les totaux d'un créneau. `null` quand la lecture échoue : le bandeau se tait.
 *
 * <p>⚠ Lire la grille ENTIÈRE pour n'en garder que `stats` coûtait tout le reste pour rien :
 * le serveur construit alors une ligne par livreur, avec le détail de chacun de ses tickets
 * et la résolution du partenaire de chaque ticket, puis le front jetait le tout. Le serveur
 * expose `/grille-paiement/stats`, qui appelle exactement le même `getStats`.</p>
 */
export async function getStatsCreneau(creneauId: string): Promise<StatsCreneau | null> {
  return apiClientHttp.request<StatsCreneau | null>({
    endpoint: `/api/creneaux/${creneauId}/grille-paiement/stats`,
    method: 'GET',
    service: 'backend',
  });
}
