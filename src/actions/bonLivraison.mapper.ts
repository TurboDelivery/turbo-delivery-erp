import { BonLivraisonTerminee, Ticket } from '@/types/bon-livraison.model';
import { formatMontant } from '@/utils/format.utils';

export function bonLivraisonToTicket(bon: BonLivraisonTerminee): Ticket {
  return {
    id: bon.commandeId,
    code: bon.reference,
    statut: 'TERMINEE',
    livreurId: bon.livreurId ?? '',
    livreur: bon.livreur,
    restaurantId: bon.restaurantId ?? '',
    restaurant: bon.restaurant,
    montantCommande: String(bon.coutCommande ?? 0),
    montantLivraison: String(bon.coutLivraison ?? 0),
    coutLivraison: String(bon.coutLivraison ?? 0),
    date: bon.date,
    heure: bon.heure,
    isNew: false,
    isEditing: false,
    commission: bon.commission ? String(bon.commission) : undefined,
    nomZone: bon.nomZone,
    zoneId: bon.zoneId,
    statutControle: bon.statutControle,
    createdByUser: bon.createdByUser,
  };
}

export function formatNumberFR(value: number | string) {
  const number = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

/**
 * Montant en francs CFA. DELEGUE au formateur unique de l'ERP.
 *
 * <p>47 fichiers appellent cette fonction. Elle portait sa propre implementation, avec
 * deux defauts que ses appelants heritaient tous :</p>
 * <ul>
 *   <li>elle rendait « 0 » NU sur une valeur absente ou nulle, sans devise, pendant que
 *       ses voisines dans la meme colonne affichaient « 1 500 FCFA » ;</li>
 *   <li>elle separait le nombre du suffixe par une espace ORDINAIRE, donc « 1 500 » et
 *       « FCFA » pouvaient se retrouver sur deux lignes differentes.</li>
 * </ul>
 *
 * <p>Elle delegue desormais a `formatMontant`, qui pose une espace INSECABLE et le
 * suffixe unique du projet. Corriger la racine aligne les 47 appelants d'un seul geste,
 * plutot que de reprendre chacun de leurs points d'appel.</p>
 *
 * <p>Les centimes disparaissent : `formatMontant` arrondit a l'unite. C'est voulu, le
 * franc CFA n'a pas de subdivision en circulation.</p>
 */
export function formatCFA(value?: number | string) {
  const nombre = typeof value === 'string' ? parseFloat(value) || 0 : value ?? 0;
  return formatMontant(Number.isFinite(nombre) ? nombre : 0);
}

export function formatDateFR(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatHoursMinutes(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
}
