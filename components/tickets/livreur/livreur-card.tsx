import React from 'react';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { ChevronDown } from 'lucide-react';
import { ILivreurTicket } from '@/features/tickets/types/tickets.type';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type LivreurCardProps = {
  livreur: ILivreurTicket;
};

function LivreurCard({ livreur }: LivreurCardProps) {
  let totalTickets = 0;
  let commissionTotale = 0;
  let totalLivraison = 0;

  livreur.tickets.forEach((jour) => {
    jour.tickets.forEach((ticket) => {
      totalTickets += 1;
      commissionTotale += Number(ticket.coutLivraison ?? 0) * 0.6;
      totalLivraison += Number(ticket.coutLivraison ?? 0);
    });
  });

  const stats = calculerStatistiquesLivreur(livreur);

  return (
    <Collapsible className="w-full">
      <CollapsibleTrigger className="w-full border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h3 className="font-bold text-sm sm:text-base">{livreur.nom}</h3>
          <div className="flex items-center justify-between sm:justify-end gap-4 text-xs sm:text-sm">
            <span className="text-gray-600">
              {totalTickets} ticket(s) • <span className="font-bold">{formatCFA(commissionTotale)}</span>
            </span>
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2">
        <div className="space-y-6">
          <div className="border border-gray-200 rounded p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-base sm:text-lg font-bold">{livreur.nom}</h3>
              <span className="text-xs sm:text-sm text-gray-600">
                {totalTickets} ticket(s) • Commission: {formatCFA(commissionTotale)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Tickets</p>
                <p className="text-xl sm:text-2xl font-bold">{totalTickets}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-orange-500 capitalize">total livraison</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-500 break-words">{formatCFA(totalLivraison)}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-blue-500 capitalize">commission</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-500 break-words">{formatCFA(commissionTotale)}</p>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Jour</th>
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Restaurant</th>
                    <th className="p-2 sm:p-3 text-right text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Montant livraison</th>
                    <th className="p-2 sm:p-3 text-right text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Montant Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {livreur.tickets.map((ticketJour, dayIndex) => {
                    const dayTotal = ticketJour.tickets.reduce((sum, ticket) => sum + Number(ticket.coutLivraison ?? 0), 0);
                    const dayCommission = dayTotal * 0.6;

                    return (
                      <React.Fragment key={`day-${dayIndex}`}>
                        {ticketJour.tickets.map((ticket, ticketIndex) => (
                          <tr key={`${ticket.id}-jour`} className="border-b border-gray-100">
                            {ticketIndex === 0 && (
                              <td rowSpan={ticketJour.tickets.length + 1} className="p-2 sm:p-3 text-xs sm:text-sm text-gray-800 whitespace-nowrap bg-gray-400">
                                {ticketJour.jour}
                              </td>
                            )}
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{ticket.restaurant}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(Number(ticket.coutLivraison ?? 0))}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(Number(ticket.coutLivraison ?? 0) * 0.6)}</td>
                          </tr>
                        ))}
                        <tr className="border-b-2 border-gray-300 bg-success-50 font-bold">
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-800 whitespace-nowrap">Total du jour</td>
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(dayTotal)}</td>
                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(dayCommission)}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
        </div>
      </CollapsibleContent>
    </Collapsible>
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

function calculerStatistiquesLivreur(livreur: ILivreurTicket, tauxCommission = 0.6) {
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

export default LivreurCard;
