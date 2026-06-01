import { Restaurant } from '@/types/models';
import { Ticket } from '@/types/bon-livraison.model';

export function calculateCommission(restaurant: Restaurant, montantCommande: number): number | null {
  if (!montantCommande) return null;
  const commission = Number(restaurant.commission ?? 0);
  if (restaurant.typeCommission === 'POURCENTAGE') {
    return Number((montantCommande * (commission / 100)).toFixed(2));
  }
  // Montant fixe (FIXE) : la commission est le montant fixe du partenaire,
  // indépendant du montant de la commande. (Corrige le "sort à 0/null" pour FIXE.)
  return Number(commission.toFixed(2));
}

export function applyTicketPatch(ticket: Ticket, patch: Partial<Ticket>, restaurants: Restaurant[]): Ticket {
  const updated: Ticket = { ...ticket, ...patch };

  const targetRestaurantId = patch.restaurantId ?? updated.restaurantId;
  const rest = restaurants.find((r) => r.id === targetRestaurantId);

  if (patch.restaurantId !== undefined && rest) {
    updated.typeCommission = rest.typeCommission;
  }

  if ((patch.montantCommande !== undefined || patch.restaurantId !== undefined) && rest) {
    const commission = calculateCommission(rest, Number(updated.montantCommande || 0));
    if (commission !== null) updated.coutLivraison = commission.toString();
  }

  return updated;
}

export function getRestaurantInfo(
  restaurantId: string,
  restaurants: Restaurant[],
): { typeCommission: string; commission: number } | undefined {
  const rest = restaurants.find((r) => r.id === restaurantId);
  if (!rest) return undefined;
  return { typeCommission: rest.typeCommission, commission: Number(rest.commission ?? 0) };
}
