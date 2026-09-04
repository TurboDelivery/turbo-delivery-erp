'use client';

import React from 'react';

const DAY_LABELS: Record<string, string> = {
  LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi', DIMANCHE: 'Dimanche',
};

export interface Horaire {
  jour: string;
  ouverture: string;
  fermeture: string;
  ferme: boolean;
}

interface HorairesSectionProps {
  horaires: Horaire[];
  setHoraires: React.Dispatch<React.SetStateAction<Horaire[]>>;
}

export function HorairesSection({ horaires, setHoraires }: HorairesSectionProps) {
  return (
    <section>
      <p className="text-sm font-medium text-foreground mb-3">Horaires d'ouverture</p>
      <div className="divide-y divide-separator border border-separator rounded-lg overflow-hidden">
        {horaires.map((h, i) => (
          <div key={h.jour} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
            <span className="font-medium text-foreground w-24">{DAY_LABELS[h.jour]}</span>
            <label className="flex items-center gap-1.5 text-xs text-muted ml-auto">
              <input
                type="checkbox"
                checked={h.ferme}
                onChange={(e) => setHoraires((prev) => prev.map((x, idx) => idx === i ? { ...x, ferme: e.target.checked } : x))}
                className="accent-primary"
              />
              Fermé
            </label>
            {!h.ferme && (
              <>
                <input
                  type="time"
                  value={h.ouverture}
                  onChange={(e) => setHoraires((prev) => prev.map((x, idx) => idx === i ? { ...x, ouverture: e.target.value } : x))}
                  className="border border-separator rounded px-2 py-1 text-xs"
                />
                <span className="text-muted">–</span>
                <input
                  type="time"
                  value={h.fermeture}
                  onChange={(e) => setHoraires((prev) => prev.map((x, idx) => idx === i ? { ...x, fermeture: e.target.value } : x))}
                  className="border border-separator rounded px-2 py-1 text-xs"
                />
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
