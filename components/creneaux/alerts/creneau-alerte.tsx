'use client';

import { AlertCircle, TrendingDown } from 'lucide-react';
import { Button } from '@heroui/react';
import { ICreneauAlerte } from '@/features/creneaux/types/creneau.types';

interface CreneauAlerteProps {
  alerte: ICreneauAlerte;
}

export function CreneauAlerte({ alerte }: CreneauAlerteProps) {
  const isRupture = alerte.type === 'rupture_reseau';
  console.log('Rendu de l\'alerte:', isRupture ? 'Rupture de reseau' : 'Alerte predictive', alerte  );

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        isRupture ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${isRupture ? 'text-red-500' : 'text-orange-500'}`}>
        {isRupture ? <AlertCircle className="size-5" /> : <TrendingDown className="size-5" />}
      </div>
      <div className="flex flex-col gap-1">
        <span className={`text-sm font-semibold ${isRupture ? 'text-red-700' : 'text-orange-700'}`}>
          {isRupture ? 'Alerte de rupture de reseau' : 'Alerte predictive - Manque d\'inscriptions'}
        </span>
        <p className="text-sm text-default-600">{alerte.message}</p>
        {alerte.joursImpactes && alerte.joursImpactes.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {alerte.joursImpactes.map((jour) => (
              <Button key={jour} size="sm" variant="bordered" color={isRupture ? 'danger' : 'warning'} className="h-7 text-xs">
                {jour}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
