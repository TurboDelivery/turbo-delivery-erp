'use client';

import { CheckCircle2, Phone, Star, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function Avatar({ nom }: { nom: string }) {
  const initiale = nom.charAt(0).toUpperCase();
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold text-xl">
      {initiale}
    </div>
  );
}

interface Props {
  ligne: IGrillePaiementLigne | null;
  creneauCode: string;
  open: boolean;
  onClose: () => void;
}

export default function GrillePaiementDetailModal({ ligne, creneauCode, open, onClose }: Props) {
  if (!ligne) return null;

  const { turboy, tickets, brut, taux, deductions, netAPayer, numeroWave, bonusEligibilite, ticketDetails } = ligne;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4">
          <Avatar nom={turboy.nom} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{turboy.nom}</h2>
            <p className="text-xs text-gray-400">{turboy.code}</p>
            <p className="text-xs text-gray-500 mt-1">
              Détail du paiement — {tickets} tickets pour le créneau{' '}
              {creneauCode.replace('CRÉNEAU-', '')}
            </p>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[80vh] px-6 pb-6 flex flex-col gap-5">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'BRUT', value: formatNumber(brut), sub: 'FCFA' },
              { label: 'TAUX', value: `${taux}`, sub: '%', highlight: true },
              {
                label: 'DÉDUCTIONS',
                value: deductions !== 0 ? `−${formatNumber(Math.abs(deductions))}` : '—',
                sub: deductions !== 0 ? 'FCFA' : '',
              },
              { label: 'NET À PAYER', value: formatNumber(netAPayer), sub: 'FCFA', bold: true },
            ].map(({ label, value, sub, highlight, bold }) => (
              <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  {label}
                </p>
                <p
                  className={cn(
                    'text-xl font-bold leading-tight',
                    highlight ? 'text-amber-500' : bold ? 'text-gray-900' : 'text-gray-700',
                  )}
                >
                  {value}
                  {sub && (
                    <span className="ml-1 text-sm font-medium text-gray-400">{sub}</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Bonus eligibility */}
          <div className="rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 bg-red-50 px-4 py-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100">
                <Star className="h-3.5 w-3.5 text-red-500" />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                Calculateur de commission — Éligibilité bonus
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {bonusEligibilite.criteres.map((critere) => (
                <div key={critere.label} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <Star className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{critere.label}</p>
                      <p className="text-xs text-gray-400">{critere.detail}</p>
                    </div>
                  </div>
                  {critere.valide ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-400 shrink-0" />
                  )}
                </div>
              ))}

              {/* Taux final */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Star className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {bonusEligibilite.tauxFinalLabel}
                  </p>
                  <p className="text-xs text-gray-400">{bonusEligibilite.tauxFinalDetail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket details */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800">
                Détail des {ticketDetails.length} ticket{ticketDetails.length > 1 ? 's' : ''}
              </p>
              <span className="text-xs text-gray-400">{creneauCode.replace('CRÉNEAU-', '')}</span>
            </div>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-3 py-2 text-left">Ticket</th>
                    <th className="px-3 py-2 text-left">Partenaire</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ticketDetails.map((t) => (
                    <tr key={t.ref} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-medium text-blue-600">{t.ref}</td>
                      <td className="px-3 py-2.5 text-gray-700">{t.partenaire}</td>
                      <td className="px-3 py-2.5 text-gray-500">{formatDate(t.date)}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-gray-800">
                        {formatNumber(t.commission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Wave */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3',
              numeroWave ? 'bg-gray-50 border border-gray-100' : 'bg-red-50 border border-red-100',
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                numeroWave ? 'bg-gray-200' : 'bg-red-100',
              )}
            >
              <Phone className={cn('h-4 w-4', numeroWave ? 'text-gray-500' : 'text-red-500')} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Numéro Wave de paiement
              </p>
              <p
                className={cn(
                  'text-sm font-semibold',
                  numeroWave ? 'text-gray-800' : 'italic text-red-500',
                )}
              >
                {numeroWave ?? 'Non renseigné'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
