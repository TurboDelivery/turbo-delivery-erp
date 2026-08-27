'use client';

import { Input } from '@/components/heroui';

export type Horaire = {
  jour: string;
  ouverture: string;
  fermeture: string;
  ferme: boolean;
};

const JOURS_LABELS: Record<string, string> = {
  LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi', DIMANCHE: 'Dimanche',
};

interface HorairesSectionProps {
  horaires: Horaire[];
  onUpdate: (index: number, key: keyof Horaire, value: string | boolean) => void;
}

export function HorairesSection({ horaires, onUpdate }: HorairesSectionProps) {
  return (
    <section>
      <p className="text-sm font-medium text-gray-700 mb-4">Horaires d'ouverture</p>
      <div className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
        {horaires.map((h, i) => (
          <div key={h.jour} className="grid grid-cols-[110px_1fr_1fr_80px] items-center gap-3 px-4 py-2.5">
            <span className="text-sm font-medium text-gray-700">{JOURS_LABELS[h.jour]}</span>
            <Input
              type="time"
              size="sm"
              variant="bordered"
              label="Ouverture"
              value={h.ouverture}
              isDisabled={h.ferme}
              onChange={(e) => onUpdate(i, 'ouverture', e.target.value)}
            />
            <Input
              type="time"
              size="sm"
              variant="bordered"
              label="Fermeture"
              value={h.fermeture}
              isDisabled={h.ferme}
              onChange={(e) => onUpdate(i, 'fermeture', e.target.value)}
            />
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={h.ferme}
                onChange={(e) => onUpdate(i, 'ferme', e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-xs text-gray-500">Fermé</span>
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
