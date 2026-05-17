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

export function formatCFA(value?: number | string) {
  if (!value) {
    return '0';
  }
  const number = typeof value === 'string' ? parseFloat(value) || 0 : value;

  // Formatage manuel simple pour éviter les problèmes de Intl.NumberFormat
  const integerPart = Math.floor(number);
  const decimalPart = Math.round((number - integerPart) * 100);

  // Formater avec le symbole FCFA manuellement
  if (decimalPart === 0) {
    return `${integerPart.toLocaleString('fr-FR')} FCFA`;
  } else {
    return `${integerPart.toLocaleString('fr-FR')},${decimalPart.toString().padStart(2, '0')} FCFA`;
  }
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
