import { BonLivraison, Ticket } from "@/types/bon-livraison.model";

export function bonLivraisonToTicket(bon: BonLivraison): Ticket {
  return {
    id: bon.commandeId,
    code: bon.reference,
    livreurId: bon.livreurId ?? '',
    livreur: bon.livreur,
    restaurantId: bon.restaurantId ?? '',
    restaurant: bon.restaurant,
    montantCommande: bon.coutCommande.toString(),
    montantLivraison: bon.coutLivraison.toString(),
    coutLivraison: bon.coutLivraison.toString(),
    date: bon.date,
    heure: bon.heure,
    isNew: false,
    isEditing: false
  };
}

{/* Fonction utilitaire pour formater */}
export function formatCFA (value: number | string) {
  const number = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

