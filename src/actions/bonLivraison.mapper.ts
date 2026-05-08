import { BonLivraisonTerminee, Ticket } from '@/types/bon-livraison.model';

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
  };
}

export function formatHoursMinutes(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
}
