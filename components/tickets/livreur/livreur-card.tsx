import React from 'react';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { ILivreurTicket } from '@/features/tickets/types/tickets.type';
import PaginationBlock from '@/components/pagination-block';
import { PageMeta } from '@/types/general';
import LivreurStats from '@/components/tickets/livreur/livreur-stats';

type LivreurCardProps = {
  livreur: ILivreurTicket;
  meta: PageMeta;
  onPageChange: (page: number) => void;
};

function LivreurCard({ livreur, meta, onPageChange }: LivreurCardProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="space-y-6">
        <div className="border border-gray-200 rounded p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h3 className="text-base sm:text-lg font-bold">{livreur.livreur}</h3>
          </div>
          <LivreurStats />
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
    </div>
  );
}

export default LivreurCard;
