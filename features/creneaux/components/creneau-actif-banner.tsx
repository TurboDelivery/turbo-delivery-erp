'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { addDays, endOfDay, format, getISOWeek, intervalToDuration, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useCreneauActifQuery } from '../queries/creneau.query';

const STATUT_CONFIG: Record<string, { label: string; className: string }> = {
  OUVERT: { label: 'Saisie en cours', className: 'bg-orange-500 hover:bg-orange-600 text-white' },
  VERROUILLE: { label: 'Verrouillé', className: 'bg-red-500 hover:bg-red-600 text-white' },
  V1_VALIDE: { label: 'V1 Validé', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
  V2_VALIDE: { label: 'V2 Validé', className: 'bg-green-600 hover:bg-green-700 text-white' },
};

function computeCountdown(dateFin: Date): string {
  const end = endOfDay(dateFin);
  const now = new Date();
  if (end <= now) return '0j 00h 00min';
  const { days = 0, hours = 0, minutes = 0 } = intervalToDuration({ start: now, end });
  return `${days}j ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}min`;
}

function formatRange(dateDebut: string, dateFin: string): string {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  if (isSameMonth(debut, fin)) {
    return `Du ${format(debut, 'd')} au ${format(fin, 'd MMMM yyyy', { locale: fr })}`;
  }
  return `Du ${format(debut, 'd MMMM', { locale: fr })} au ${format(fin, 'd MMMM yyyy', { locale: fr })}`;
}

export function CreneauActifBanner() {
  const { data: creneau, isLoading } = useCreneauActifQuery();
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!creneau) return;
    const dateVerrouillage = addDays(creneau.dateFin, 3);
    setCountdown(computeCountdown(dateVerrouillage));
    const id = setInterval(() => setCountdown(computeCountdown(dateVerrouillage)), 60_000);
    return () => clearInterval(id);
  }, [creneau]);

  if (isLoading || !creneau) return null;

  const week = getISOWeek(new Date(creneau.dateDebut));
  const range = formatRange(creneau.dateDebut, creneau.dateFin);
  const statut = STATUT_CONFIG[creneau.statut] ?? { label: creneau.statut, className: 'bg-gray-500 text-white' };

  return (
    <div className="bg-surface rounded-lg border border-separator px-5 py-4 mb-4">
      <p className="text-base font-bold text-foreground">
        Semaine {week} — {range}
      </p>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Statut :</span>
          <Badge className={`${statut.className} text-xs font-semibold px-2.5 py-0.5 rounded-full border-0`}>{statut.label}</Badge>
        </div>
        {countdown && (
          <div className="flex items-center gap-1.5 text-red-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Verrouillage auto dans {countdown}</span>
          </div>
        )}
      </div>
    </div>
  );
}
