'use client';

import { Card } from '@heroui-v3/react';
import { TrendingDown, TrendingUp } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { CapaciteFiabiliteCards } from '@/components/creneaux/analyse/capacite-fiabilite-cards';
import { CreneauPeriodeCard } from '@/components/creneaux/analyse/creneau-periode-card';
import { EvolutionTable } from '@/components/creneaux/analyse/evolution-table';
import { useCreneauAnalyseComparaisonQuery } from '@/features/creneaux/queries/creneau.query';

/**
 * Les trois chiffres du mois, en tête d'onglet.
 *
 * <p>C'étaient trois pastilles alignées À DROITE, en vert, en rouge de marque et en rouge
 * de danger. Le vert et le rouge y disaient « bon » et « mauvais » d'un taux dont personne
 * ne connaît le seuil : 78 % de présence, est-ce bien ? Les couleurs répondaient à la
 * place du lecteur. Restent trois mesures, alignées à gauche parce qu'on les lit, en
 * chasse tabulaire parce qu'on les compare d'un mois sur l'autre.</p>
 */
function BandeauMois({
  absences,
  fiabilite,
  presence,
}: {
  absences: number;
  fiabilite: number;
  presence: number;
}) {
  const mesures = [
    { libelle: 'Taux de présence', valeur: `${presence} %` },
    { libelle: 'Fiabilité', valeur: `${fiabilite} %` },
    { libelle: 'Absences ce mois', valeur: String(absences) },
  ];

  return (
    <Card>
      <Card.Content className="flex-row flex-wrap gap-x-10 gap-y-4 p-4">
        {mesures.map((m) => (
          <div className="flex flex-col" key={m.libelle}>
            <span className="text-xs tracking-wide text-muted uppercase">{m.libelle}</span>
            <span className="text-xl font-bold tabular-nums text-foreground">{m.valeur}</span>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}

/**
 * Bandeau de comparaison : un écart, sa direction, sa phrase.
 *
 * <p>Les deux bandeaux de l'onglet étaient peints à la main en `bg-success-50` /
 * `bg-danger-50` / `bg-warning-50`. Le second faisait passer pour un AVERTISSEMENT le
 * simple fait que le soir soit plus fiable que le matin — une information, pas une alerte.
 * La direction du chiffre se lit maintenant sur la flèche et sur le signe, la surface
 * reste neutre.</p>
 */
function BandeauEcart({
  hausse,
  message,
  titre,
}: {
  hausse: boolean;
  message: string;
  titre: string;
}) {
  const Fleche = hausse ? TrendingUp : TrendingDown;
  return (
    <Card>
      <Card.Content className="flex-row items-center gap-3 p-4">
        <Fleche
          aria-hidden="true"
          className={`size-5 shrink-0 ${hausse ? 'text-success' : 'text-warning'}`}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">{titre}</p>
          <p className="text-sm text-muted">{message}</p>
        </div>
      </Card.Content>
    </Card>
  );
}

export function CreneauAnalyseTab() {
  const { data, isError, isFetching, refetch } = useCreneauAnalyseComparaisonQuery();

  const miniStats = data?.miniStats;
  const capacite = data?.capacite ?? { inscrits: 0, pourcentage: 0, tauxConfirmation: 0, total: 0 };
  const fiabilite = data?.fiabilite ?? {
    absencesJustifiees: 0,
    gpsConfirme: 0,
    pourcentage: 0,
    total: 0,
  };
  const ecart = data?.ecartPrevisionRealite;
  const matin = data?.creneaux?.matin ?? { absences: 0, justifiees: 0, taux: 0 };
  const soir = data?.creneaux?.soir ?? { absences: 0, justifiees: 0, taux: 0 };
  const evolution = data?.evolutionMensuelle ?? [];

  const diffMatinSoir = matin.taux - soir.taux;

  // Sans cette sortie, une lecture ratee retombait sur les valeurs par defaut :
  // l'onglet affirmait « 0 % de presence, 0 absence », des chiffres qu'il n'avait
  // pas lus. On remplace l'analyse entiere plutot que d'afficher des zeros.
  if (isError) {
    return (
      <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="l'analyse des créneaux" />
    );
  }

  return (
    <div className="space-y-6">
      <BandeauMois
        absences={miniStats?.absencesMois ?? 0}
        fiabilite={miniStats?.fiabilite ?? 0}
        presence={miniStats?.tauxPresence ?? 0}
      />

      <CapaciteFiabiliteCards capacite={capacite} fiabilite={fiabilite} />

      <BandeauEcart
        hausse={(ecart?.valeur ?? 0) >= 0}
        message={ecart?.message ?? '-'}
        titre="Écart prévision / réalité"
      />

      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Comparaison matin / soir</h3>
          <p className="text-sm text-muted">Taux de présence par créneau</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CreneauPeriodeCard
            absences={matin.absences}
            justifiees={matin.justifiees}
            label="Créneau du matin"
            taux={matin.taux}
            variant="matin"
          />
          <CreneauPeriodeCard
            absences={soir.absences}
            justifiees={soir.justifiees}
            label="Créneau du soir"
            taux={soir.taux}
            variant="soir"
          />
        </div>
        {diffMatinSoir !== 0 && (
          <BandeauEcart
            hausse={diffMatinSoir > 0}
            message={
              diffMatinSoir > 0
                ? `Le matin est plus fiable de ${diffMatinSoir} points.`
                : `Le soir est plus fiable de ${Math.abs(diffMatinSoir)} points.`
            }
            titre="Le créneau le plus fiable"
          />
        )}
      </div>

      <EvolutionTable data={evolution} />
    </div>
  );
}
