import React from 'react';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { ILivreurTicket } from '@/features/tickets/types/tickets.type';

type LivreurRestaurantStatsTableProps = {
  livreur: ILivreurTicket;
};

function LivreurRestaurantStatsTable({ livreur }: LivreurRestaurantStatsTableProps) {
  const stats = calculerStatistiquesLivreur(livreur);

  return (
    <div className="border border-gray-200 rounded p-4 sm:p-6">
      <h4 className="text-sm sm:text-base font-bold mb-4">Statistiques par restaurant</h4>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Restaurant</th>
              <th className="p-2 sm:p-3 text-right text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Total Tickets</th>
              <th className="p-2 sm:p-3 text-right text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Montant Livraison</th>
              <th className="p-2 sm:p-3 text-right text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Montant Commandes</th>
              <th className="p-2 sm:p-3 text-right text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Commission Totale</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.restaurantId} className="border-b border-gray-100">
                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{stat.restaurant}</td>
                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{stat.nombreTotalTickets}</td>
                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(stat.montantTotalLivraisons)}</td>
                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(stat.montantTotalCommandes)}</td>
                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(stat.commissionTotale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type RestaurantStats = {
  restaurantId: string;
  restaurant: string;
  nombreTotalTickets: number;
  montantTotalLivraisons: number;
  montantTotalCommandes: number;
  commissionTotale: number;
};

export function calculerStatistiquesLivreur(livreur: ILivreurTicket, tauxCommission = 0.6) {
  const statsParRestaurant: Record<string, RestaurantStats> = {};

  livreur.tickets.forEach((jour) => {
    jour.tickets.forEach((ticket) => {
      const restaurantId = ticket.restaurantId;
      if (!statsParRestaurant[restaurantId]) {
        statsParRestaurant[restaurantId] = {
          restaurantId: restaurantId,
          restaurant: ticket.restaurant,
          nombreTotalTickets: 0,
          montantTotalLivraisons: 0,
          montantTotalCommandes: 0,
          commissionTotale: 0,
        };
      }

      const commission = Number(ticket.coutLivraison) * tauxCommission;

      statsParRestaurant[restaurantId].nombreTotalTickets += 1;
      statsParRestaurant[restaurantId].montantTotalLivraisons += Number(ticket.coutLivraison);
      statsParRestaurant[restaurantId].montantTotalCommandes += ticket.coutCommande;
      statsParRestaurant[restaurantId].commissionTotale += commission;
    });
  });

  return Object.values(statsParRestaurant).map((stat) => ({
    restaurantId: stat.restaurantId,
    restaurant: stat.restaurant,
    nombreTotalTickets: stat.nombreTotalTickets,
    montantTotalLivraisons: stat.montantTotalLivraisons,
    montantTotalCommandes: stat.montantTotalCommandes,
    commissionTotale: stat.commissionTotale,
    totalGeneral: stat.commissionTotale + stat.montantTotalCommandes,
  }));
}

export default LivreurRestaurantStatsTable;