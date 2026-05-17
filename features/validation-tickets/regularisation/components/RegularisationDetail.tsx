'use client';

import { useState } from 'react';
import { X, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { formatMontant } from '@/utils/format.utils';

interface Props {
  ticket: BonLivraisonTerminee;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, motif: string) => void;
}

export default function RegularisationDetail({ ticket, isApproving, isRejecting, onApprove, onReject }: Props) {
  const [motif, setMotif] = useState('');
  const canReject = motif.trim().length >= 30;

  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-400 px-4 sm:px-6 py-4">
        <span className="text-lg sm:text-xl font-extrabold text-white">{ticket.reference}</span>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1">
          <Clock className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-semibold text-white">
            Saisi à {ticket.heure} (hors créneau)
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-100 pb-5">
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
          {ticket.createdByUser && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Créé par</p>
              <p className="text-sm font-bold text-gray-900">
                {ticket.createdByUser.prenoms} {ticket.createdByUser.nom}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Montant CMD</p>
            <p className="text-sm font-bold text-gray-900">{formatMontant(ticket.coutCommande)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Coût Livraison</p>
            <p className="text-sm font-bold text-orange-500">{formatMontant(ticket.coutLivraison)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-red-600">
              Motif de rejet <span className="text-xs font-normal text-gray-400">(obligatoire, min 30 caractères)</span>
            </p>
          </div>
          <Textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Décrivez la raison du rejet pour fraude..."
            className="resize-none text-sm"
            rows={3}
          />
          {motif.length > 0 && motif.trim().length < 30 && (
            <p className="text-xs text-red-500">{30 - motif.trim().length} caractères manquants</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-100 px-4 sm:px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => onReject(ticket.commandeId, motif.trim())}
          disabled={!canReject || isRejecting}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 disabled:opacity-40"
        >
          <X className="h-4 w-4" />
          {isRejecting ? 'Rejet...' : 'Rejeter (Fraude)'}
        </Button>

        <Button
          onClick={() => onApprove(ticket.commandeId)}
          disabled={isApproving}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-5 disabled:opacity-60"
        >
          <ShieldCheck className="h-4 w-4" />
          {isApproving ? 'Approbation...' : 'Approuver (Retard)'}
          {!isApproving && <span className="ml-1">→</span>}
        </Button>
      </div>
    </div>
  );
}
