import React from 'react';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { ChevronDown } from 'lucide-react';
import { ILivreurTicket } from '@/features/tickets/types/tickets.type';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PaginationBlock from '@/components/pagination-block';
import { PageMeta } from '@/types/general';

type LivreurCardProps = {
  livreur: ILivreurTicket;
  meta: PageMeta;
  onPageChange: (page: number) => void;
};

function LivreurCard({ livreur, meta, onPageChange }: LivreurCardProps) {
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

  const fullName = `${livreur.nom} ${livreur.prenom}`;

  return (
    <Collapsible className="w-full" open={true}>
      <CollapsibleTrigger className="w-full border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h3 className="font-bold text-sm sm:text-base">{fullName}</h3>
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
              <h3 className="text-base sm:text-lg font-bold">{fullName}</h3>
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
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap text-">Code check</th>
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Restaurant</th>
                    <th className="p-2 sm:p-3 text-right text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Montant livraison</th>
                    <th className="p-2 sm:p-3 text-right text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Montant Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {livreur.tickets.map((ticketJour, dayIndex) => {
                    // const dayTotal = ticketJour.tickets.reduce((sum, ticket) => sum + Number(ticket.coutLivraison ?? 0), 0);
                    // const dayCommission = dayTotal * 0.6;
                    return (
                      <React.Fragment key={`day-${dayIndex}`}>
                        {ticketJour.tickets.map((ticket, ticketIndex) => (
                          <tr key={`${ticketIndex}-jour`} className="border-b border-gray-100">
                            {ticketIndex === 0 && (
                              <td rowSpan={ticketJour.tickets.length} className="p-2 sm:p-3 text-xs sm:text-sm text-gray-800 whitespace-nowrap bg-gray-400">
                                {ticketJour.jour}
                              </td>
                            )}
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-orange-600 whitespace-nowrap font-medium">{ticket.reference}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{ticket.restaurant}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(Number(ticket.coutLivraison ?? 0))}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(Number(ticket.coutLivraison ?? 0) * 0.6)}</td>
                          </tr>
                        ))}
                        {/*<tr className="border-b-2 border-gray-300 bg-success-50 font-bold">*/}
                        {/*  <td colSpan={2} className="p-2 sm:p-3 text-xs sm:text-sm text-gray-800 whitespace-nowrap">*/}
                        {/*    Total du jour*/}
                        {/*  </td>*/}
                        {/*  <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(dayTotal)}</td>*/}
                        {/*  <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700 text-right whitespace-nowrap">{formatCFA(dayCommission)}</td>*/}
                        {/*</tr>*/}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationBlock totalPages={meta.totalPages} currentPage={meta.currentPage} onPageChange={onPageChange} />
          {/*<LivreurRestaurantStatsTable livreur={livreur}/>*/}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default LivreurCard;
