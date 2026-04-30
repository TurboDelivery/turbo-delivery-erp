'use client';

import { X, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RegularisationTicket } from '../data/fake-regularisation-tickets';

interface Props {
  ticket: RegularisationTicket;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function RegularisationDetail({ ticket, onApprove, onReject }: Props) {
  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
      <div className="flex items-center justify-between bg-amber-400 px-6 py-4">
        <span className="text-xl font-extrabold text-white">{ticket.ref}</span>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1">
          <Clock className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-semibold text-white">
            Saisi à {ticket.time} (hors créneau)
          </span>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Livreur</p>
            <p className="text-sm font-bold text-gray-900">{ticket.livreur}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Restaurant</p>
            <p className="text-sm font-bold text-gray-900">{ticket.restaurant}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Date</p>
            <p className="text-sm font-bold text-gray-900">{ticket.date}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Montant CMD</p>
            <p className="text-sm font-bold text-gray-900">{ticket.montantCmd}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Montant Livraison</p>
            <p className="text-sm font-bold text-gray-900">{ticket.montantLivraison}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Coût Livraison</p>
            <p className="text-sm font-bold text-orange-500">{ticket.coutLivraison}</p>
          </div>
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <p className="text-sm font-semibold text-orange-600">Motif de régularisation</p>
          </div>
          <p className="text-sm text-gray-700">{ticket.motif}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => onReject(ticket.id)}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600"
        >
          <X className="h-4 w-4" />
          Rejeter
        </Button>

        <Button
          onClick={() => onApprove(ticket.id)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-5"
        >
          <ShieldCheck className="h-4 w-4" />
          Approuver (Retard)
          <span className="ml-1">→</span>
        </Button>
      </div>
    </div>
  );
}
