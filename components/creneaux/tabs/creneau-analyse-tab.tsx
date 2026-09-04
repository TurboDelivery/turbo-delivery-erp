'use client';

import { Chip } from '@/components/heroui';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { CapaciteFiabiliteCards } from '@/components/creneaux/analyse/capacite-fiabilite-cards';
import { CreneauPeriodeCard } from '@/components/creneaux/analyse/creneau-periode-card';
import { EvolutionTable } from '@/components/creneaux/analyse/evolution-table';
import { useCreneauAnalyseComparaisonQuery } from '@/features/creneaux/queries/creneau.query';
import EtatErreur from '@/components/commons/EtatErreur';

export function CreneauAnalyseTab() {
  const { data, isError, isFetching, refetch } = useCreneauAnalyseComparaisonQuery();

  const miniStats = data?.miniStats;
  const capacite = data?.capacite ?? { pourcentage: 0, inscrits: 0, total: 0, tauxConfirmation: 0 };
  const fiabilite = data?.fiabilite ?? { pourcentage: 0, gpsConfirme: 0, total: 0, absencesJustifiees: 0 };
  const ecart = data?.ecartPrevisionRealite;
  const matin = data?.creneaux?.matin ?? { taux: 0, absences: 0, justifiees: 0 };
  const soir = data?.creneaux?.soir ?? { taux: 0, absences: 0, justifiees: 0 };
  const evolution = data?.evolutionMensuelle ?? [];

  const ecartPositif = (ecart?.valeur ?? 0) >= 0;
  const diffMatinSoir = matin.taux - soir.taux;

  // Sans cette sortie, une lecture ratee retombait sur les valeurs par defaut :
  // l'onglet affirmait « 0 % de presence, 0 absence », des chiffres qu'il n'avait
  // pas lus. On remplace l'analyse entiere plutot que d'afficher des zeros.
  if (isError) {
    return (
      <EtatErreur
        quoi="l'analyse des créneaux"
        onReessayer={() => refetch()}
        enCours={isFetching}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Mini stats */}
      <div className="flex justify-end gap-3">
        <Chip color="success" variant="flat">{miniStats?.tauxPresence ?? 0}% Taux Presence</Chip>
        <Chip color="primary" variant="flat">{miniStats?.fiabilite ?? 0}% Fiabilite</Chip>
        <Chip color="danger" variant="flat">{miniStats?.absencesMois ?? 0} Absences ce mois</Chip>
      </div>

      {/* Capacité & Fiabilité */}
      <CapaciteFiabiliteCards capacite={capacite} fiabilite={fiabilite} />

      {/* Alerte écart */}
      <div className={`flex items-center gap-3 rounded-lg p-4 ${ecartPositif ? 'bg-success-50 text-success-soft-foreground' : 'bg-danger-50 text-danger-soft-foreground'}`}>
        {ecartPositif ? <TrendingUp className="size-5 shrink-0" /> : <TrendingDown className="size-5 shrink-0" />}
        <div>
          <p className="font-semibold">Ecart Prevision / Realite</p>
          <p className="text-sm">{ecart?.message ?? '-'}</p>
        </div>
      </div>

      {/* Comparaison Matin vs Soir */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">Comparaison Matin vs Soir</h3>
          <p className="text-sm text-default-500">Analyse des taux de presence par creneau</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CreneauPeriodeCard label="Creneau Matin" variant="matin" taux={matin.taux} absences={matin.absences} justifiees={matin.justifiees} />
          <CreneauPeriodeCard label="Creneau Soir" variant="soir" taux={soir.taux} absences={soir.absences} justifiees={soir.justifiees} />
        </div>
      </div>

      {/* Banner comparaison */}
      {diffMatinSoir !== 0 && (
        <div className={`flex items-center justify-center gap-2 rounded-lg p-4 ${diffMatinSoir > 0 ? 'bg-success-50 text-success-soft-foreground' : 'bg-warning-50 text-warning-soft-foreground'}`}>
          {diffMatinSoir > 0 ? <TrendingUp className="size-5 shrink-0" /> : <TrendingDown className="size-5 shrink-0" />}
          <p className="font-semibold">
            {diffMatinSoir > 0
              ? `+${diffMatinSoir}% Meilleure fiabilite le matin`
              : `+${Math.abs(diffMatinSoir)}% Meilleure fiabilite le soir`}
          </p>
        </div>
      )}

      {/* Évolution Mensuelle */}
      <EvolutionTable data={evolution} />
    </div>
  );
}

