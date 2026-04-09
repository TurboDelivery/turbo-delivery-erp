'use client';

import { Chip } from '@heroui/react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { CapaciteFiabiliteCards } from '@/components/creneaux/analyse/capacite-fiabilite-cards';
import { CreneauPeriodeCard } from '@/components/creneaux/analyse/creneau-periode-card';
import { EvolutionTable } from '@/components/creneaux/analyse/evolution-table';

// --- Mock data ---
const MOCK_CAPACITE = { pourcentage: 92, inscrits: 92, total: 100, tauxConfirmation: 98 };
const MOCK_FIABILITE = { pourcentage: 87, gpsConfirme: 87, total: 100, absencesJustifiees: 8 };

const MOCK_EVOLUTION = [
  { mois: 'Mars 2026', previsionnel: 92, reel: 87, ecart: -5, tendance: 'down' as const },
  { mois: 'Fevrier 2026', previsionnel: 90, reel: 88, ecart: -2, tendance: 'up' as const },
  { mois: 'Janvier 2026', previsionnel: 88, reel: 82, ecart: -6, tendance: 'down' as const },
];

export function CreneauAnalyseTab() {
  return (
    <div className="space-y-6">
      {/* Mini stats */}
      <div className="flex justify-end gap-3">
        <Chip color="success" variant="flat">87% Taux Presence</Chip>
        <Chip color="primary" variant="flat">94% Fiabilite</Chip>
        <Chip color="danger" variant="flat">12 Absences ce mois</Chip>
      </div>

      {/* Capacité & Fiabilité */}
      <CapaciteFiabiliteCards capacite={MOCK_CAPACITE} fiabilite={MOCK_FIABILITE} />

      {/* Alerte écart */}
      <div className="flex items-center gap-3 rounded-lg bg-danger-50 p-4 text-danger">
        <TrendingDown className="size-5 shrink-0" />
        <div>
          <p className="font-semibold">Ecart Prevision / Realite</p>
          <p className="text-sm">La fiabilite terrain est inferieure de -5% par rapport a la capacite prevue</p>
        </div>
      </div>

      {/* Comparaison Matin vs Soir */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">Comparaison Matin vs Soir</h3>
          <p className="text-sm text-default-500">Analyse des taux de presence par creneau</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CreneauPeriodeCard label="Creneau Matin" variant="matin" taux={89} absences={8} justifiees={3} />
          <CreneauPeriodeCard label="Creneau Soir" variant="soir" taux={85} absences={11} justifiees={4} />
        </div>
      </div>

      {/* Banner comparaison */}
      <div className="flex items-center justify-center gap-2 rounded-lg bg-success-50 p-4 text-success">
        <TrendingUp className="size-5 shrink-0" />
        <p className="font-semibold">+4% Meilleure fiabilite le matin</p>
      </div>

      {/* Évolution Mensuelle */}
      <EvolutionTable data={MOCK_EVOLUTION} />
    </div>
  );
}
