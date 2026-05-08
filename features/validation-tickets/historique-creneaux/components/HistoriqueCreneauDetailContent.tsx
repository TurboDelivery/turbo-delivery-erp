'use client';

import { AlertTriangle, CheckSquare, CreditCard, Download, Printer, Receipt, TrendingUp, Users, XCircle } from 'lucide-react';
import { formatMontantCompact } from '@/utils/format.utils';
import useHistoriqueCreneauDetail from '../hooks/use-historique-creneau-detail';
import HistoriqueCreneauDetailLivreurs from './HistoriqueCreneauDetailLivreurs';
import HistoriqueCreneauDetailTimeline from './HistoriqueCreneauDetailTimeline';
import { getLotStatutConfig } from '../utils/lot-statut.utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  id: string;
}

export default function HistoriqueCreneauDetailContent({ id }: Props) {
  const { detail, isLoading } = useHistoriqueCreneauDetail(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!detail) return null;

  const statut = getLotStatutConfig(detail.statut);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header card */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{detail.code}</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statut.className}`}>
                {statut.label}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Créneau {detail.code.replace('CRÉNEAU-', '')} · {detail.periodeDebut} → {detail.periodeFin}
            </p>
            {detail.soumisLe && (
              <p className="text-xs text-gray-500">
                <span className="text-red-400">Soumis le</span> {detail.soumisLe}
                {detail.soumisParNom && (
                  <>
                    {' '}
                    · Par <span className="font-medium text-gray-700">{detail.soumisParNom}</span>
                  </>
                )}
              </p>
            )}
            {detail.derniereAction && (
              <p className="text-xs text-gray-400">
                Dernière action : <span className="text-gray-600">{detail.derniereAction}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Printer className="h-4 w-4" />
              Imprimer
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Motif de régularisation */}
      {detail.motifRegularisation && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Motif de régularisation
          </p>
          <p className="mt-1 text-sm text-amber-800">{detail.motifRegularisation}</p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Livreurs', value: detail.kpi.livreurs, icon: Users, compact: false, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Tickets', value: detail.kpi.tickets, icon: Receipt, compact: false, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Total Brut', value: detail.kpi.totalBrut, icon: TrendingUp, compact: true, color: 'text-red-500', bg: 'bg-red-50', unit: 'FCFA' },
          { label: 'Total Net', value: detail.kpi.totalNet, icon: CreditCard, compact: true, color: 'text-green-500', bg: 'bg-green-50', unit: 'FCFA', valueClass: 'text-green-500' },
        ].map(({ label, value, icon: Icon, compact, color, bg, unit, valueClass }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${valueClass ?? 'text-gray-900'} leading-tight`}>
              {compact ? formatMontantCompact(value as number) : value}
              {unit && <span className="ml-1 text-sm font-medium text-gray-500">{unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <HistoriqueCreneauDetailLivreurs livreurs={detail.livreurs} />
        <HistoriqueCreneauDetailTimeline events={detail.timeline} />
      </div>
    </div>
  );
}
