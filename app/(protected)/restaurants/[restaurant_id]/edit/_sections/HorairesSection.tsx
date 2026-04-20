'use client';

import React from 'react';
import { Button } from '@heroui/react';
import { IOpeningHour } from '@/features/restaurants/types/restaurant.type';

const DAY_LABELS: Record<string, string> = {
  LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi', DIMANCHE: 'Dimanche',
};

function formatTime(t: string) {
  return t?.slice(0, 5) ?? '';
}

interface HorairesSectionProps {
  openingHours: IOpeningHour[];
}

export function HorairesSection({ openingHours }: HorairesSectionProps) {
  return (
    <section>
      <p className="text-sm font-medium text-gray-700 mb-3">Horaires d'ouverture</p>
      {openingHours?.length > 0 ? (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {openingHours.map((h) => (
            <div key={h.id} className="flex justify-between items-center px-4 py-2.5 text-sm">
              <span className="font-medium text-gray-700 w-28">{DAY_LABELS[h.dayOfWeek] ?? h.dayOfWeek}</span>
              {h.closed ? (
                <span className="text-gray-400">Fermé</span>
              ) : (
                <span className="text-gray-600">{formatTime(h.openingTime)} – {formatTime(h.closingTime)}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-400">non défini</span>
          <Button type="button" variant="light" size="sm" className="text-primary">Ajouter</Button>
        </div>
      )}
    </section>
  );
}
