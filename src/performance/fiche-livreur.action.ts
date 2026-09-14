'use server';

import { apiClientHttp } from '@/lib/api-client-http';

/** Un ticket, tel que la grille de paie le détaille. */
export interface TicketPaie {
  ref: string;
  partenaire: string;
  /** Horodatage ISO de la course. */
  date: string;
  fraisLivraison: number;
  commission: number;
}

/**
 * La ligne de paie d'un livreur sur un créneau.
 *
 * <p>C'est la source qui FAIT AUTORITÉ pour l'argent, conformément à l'arbitrage de l'owner
 * du 14/09 : la fiche affiche ce que la grille de paie calcule, et non un second calcul qui
 * pourrait en diverger.</p>
 */
export interface LignePaieLivreur {
  id: string;
  turboy: { id: string; nom: string; code: string | null; telephone: string | null };
  typeLivreur: string | null;
  tickets: number;
  brut: number;
  taux: number | null;
  tauxManuel: boolean | null;
  bonus: number | null;
  bonusEligibilite: string | null;
  prime: number | null;
  deductions: number | null;
  netAPayer: number;
  totalFraisLivraison: number | null;
  numeroWave: string | null;
  statut: string | null;
  inclusDansPaie: boolean | null;
  inclusPaieMotif: string | null;
  flagAttente: boolean | null;
  ticketDetails: TicketPaie[] | null;
}

/**
 * La ligne de paie d'UN livreur sur un créneau.
 *
 * <p>⚠ La grille n'offre aucun filtre par livreur : elle se lit paginée, et sa taille par
 * défaut est de vingt lignes pour cinquante-et-un livreurs. On demande donc la page entière
 * puis on cherche la ligne. Se contenter du défaut aurait rendu introuvables les deux tiers
 * des livreurs, sans rien signaler.</p>
 *
 * <p>`null` quand le livreur n'a pas de ligne sur ce créneau : il n'a pas été payé cette
 * semaine-là. C'est un fait, pas une panne, et la fiche doit le dire.</p>
 */
export async function getLignePaieLivreur(
  creneauId: string,
  livreurId: string,
): Promise<LignePaieLivreur | null> {
  const grille = await apiClientHttp.request<{
    lignes: { content: LignePaieLivreur[] };
  } | null>({
    endpoint: `/api/creneaux/${creneauId}/grille-paiement`,
    method: 'GET',
    service: 'backend',
    params: { page: '0', size: '300' },
  });

  return grille?.lignes?.content?.find((l) => l.turboy?.id === livreurId) ?? null;
}
