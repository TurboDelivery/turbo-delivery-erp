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

/**
 * `15/09/2026`. L'ANNEE SUR QUATRE CHIFFRES, toujours.
 *
 * <h3>Ce que le format precedent cachait</h3>
 * <p>Il demandait `year: 'numeric'`, ce qui rend l'annee sans la completer : l'an 26 s'ecrit
 * « 26 ». Un ticket enregistre par megarde a l'annee 26 — le champ de date accepte deux
 * chiffres dans son segment d'annee — s'affichait donc « 15/09/26 » et se lisait 2026.</p>
 *
 * <p>Ce n'est pas une hypothese : le 16/09/2026, SOIXANTE-HUIT des soixante-dix tickets en
 * regularisation portaient l'annee 0026. Ils etaient marques « Tardif » a juste titre — l'an
 * 26 n'est dans aucun creneau — introuvables par le filtre de periode, et l'ecran les
 * presentait comme des bons du 14 et du 15 septembre. Personne ne pouvait voir l'erreur.</p>
 *
 * <p>Une date impossible doit maintenant se voir : « 15/09/0026 » ne se confond avec rien.</p>
 */
export function formatDateFR(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString ?? '';

  const jour = String(date.getDate()).padStart(2, '0');
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  // `padStart` et non `toLocaleDateString` : c'est le seul moyen de garder les zeros de
  // tete d'une annee aberrante, que toutes les options d'`Intl` suppriment.
  const annee = String(date.getFullYear()).padStart(4, '0');
  return `${jour}/${mois}/${annee}`;
}

/**
 * Une date qu'aucun ticket ne peut porter.
 *
 * <p>Sert a SIGNALER, pas a corriger : la ligne existe, son montant compte, et l'effacer de
 * l'ecran serait pire. On la montre, et on dit qu'elle est impossible.</p>
 */
export function dateImpossible(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return true;
  const annee = date.getFullYear();
  return annee < 2000 || annee > new Date().getFullYear() + 1;
}

export function formatHoursMinutes(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
}
