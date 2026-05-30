'use client';

import type { ReactNode } from 'react';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { AgentCell, formatDate } from './verrouillage-v2-columns';

/**
 * Carte mobile d'un ticket V2 — remplace la ligne du tableau dense sur petit
 * écran (cf. wrapper `hidden md:block` / `md:hidden`). Mêmes données que les
 * colonnes (verrouillage-v2-columns / v2-valide-columns) : on réutilise
 * `AgentCell`, `formatDate` et `formatCFA` pour garantir zéro divergence.
 * Les actions (Valider V2 / Rejeter) sont passées par la liste appelante.
 */
export default function TicketV2MobileCard({
  ticket,
  actions,
}: {
  ticket: TicketControleV2;
  actions?: ReactNode;
}) {
  const zone = ticket.nomZone ?? 'VERTE';

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{ticket.reference}</p>
          <p className="truncate text-xs text-gray-500">{ticket.livreur}</p>
        </div>
        <span
          title={zone}
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-green-500 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 max-w-[140px]"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
          <span className="truncate">{zone}</span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-xs text-gray-400">Partenaire</span>
        <span className="truncate text-right text-sm text-blue-500">{ticket.restaurant}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-xs text-gray-400">Date</span>
        <span className="text-right text-sm text-gray-700">{formatDate(ticket.date)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="text-gray-400">CMD</span>
        <span className="font-semibold text-gray-700">{formatCFA(ticket.coutCommande)}</span>
        <span className="text-gray-200">·</span>
        <span className="text-gray-400">LIV</span>
        <span className="font-semibold text-gray-700">{formatCFA(ticket.coutLivraison)}</span>
        <span className="text-gray-200">·</span>
        <span className="text-gray-400">COM</span>
        <span className="font-semibold text-green-600">
          {ticket.commission != null ? formatCFA(ticket.commission) : '—'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-2 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">Créé par</p>
          <AgentCell agent={ticket.createdByUser} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">Auth par</p>
          <AgentCell agent={ticket.vauthAgent} date={ticket.vauthAt} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">V1 par</p>
          <AgentCell agent={ticket.v1Agent} date={ticket.v1ValideAt} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">V2 par</p>
          <AgentCell agent={ticket.v2Agent} date={ticket.v2ValideAt} />
        </div>
      </div>

      {actions && <div className="pt-1">{actions}</div>}
    </div>
  );
}
