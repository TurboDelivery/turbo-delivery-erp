'use client';

import { Avatar, Button, Skeleton } from '@/components/heroui';
import { ArrowLeft, CheckCircle2, Download, Lightbulb, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { CreneauStatCard } from '@/components/creneaux/stats/creneau-stat-card';
import { useCreneauDetailJourQuery } from '@/features/creneaux/queries/creneau.query';
import { ICreneauTurboySimple } from '@/features/creneaux/types/creneau.types';
import { createUrlFile } from '@/utils/createUrlFile';
import { exportPresenceJournalierePdf } from './presence-journaliere-pdf';

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).replace(/^./, (c) => c.toUpperCase());
}

function TurboyBadge({ turboy, variant }: { turboy: ICreneauTurboySimple; variant: 'present' | 'absent' }) {
  const Icon = variant === 'present' ? CheckCircle2 : XCircle;
  const iconColor = variant === 'present' ? 'text-success-soft-foreground' : 'text-danger-soft-foreground';
  const subtitle = variant === 'absent' ? 'Inscrit mais absent' : undefined;

  return (
    <div className="flex items-center gap-2">
      <Icon className={`size-5 shrink-0 ${iconColor}`} />
      <Avatar
        size="sm"
        src={turboy.avatar ? createUrlFile(turboy.avatar, 'backend') : undefined}
        name={turboy.nomComplet}
        className="shrink-0"
      />
      <div>
        <p className="text-sm font-medium leading-tight">{turboy.nomComplet}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

interface JourDetailContentProps {
  date: string;
}

export function JourDetailContent({ date }: JourDetailContentProps) {
  const { data, isLoading, isError } = useCreneauDetailJourQuery(date);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportPdf() {
    if (!data) return;
    setIsExporting(true);
    try {
      await exportPresenceJournalierePdf(data);
    } finally {
      setIsExporting(false);
    }
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <XCircle className="size-10 text-danger-soft-foreground" />
        <p className="font-semibold text-danger-soft-foreground">Impossible de charger les données</p>
        <p className="text-sm text-muted-foreground">Une erreur est survenue lors de la récupération des présences du jour.</p>
        <Link
          href="/delivery-men/creneaux"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
        >
          <ArrowLeft className="size-4" />
          Retour au planning
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/delivery-men/creneaux"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="size-4" />
            Retour au planning
          </Link>

          {isLoading ? (
            <Skeleton className="h-8 w-48 rounded-lg" />
          ) : (
            <h1 className="text-2xl font-bold text-primary">{formatDateLabel(date)}</h1>
          )}
          <p className="text-sm text-muted-foreground">Détail de la journée</p>
        </div>
        {!isLoading && (
          <Button
            size="sm"
            variant="bordered"
            startContent={<Download className="size-4" />}
            isLoading={isExporting}
            onPress={handleExportPdf}
            className="shrink-0 mt-7"
          >
            Exporter PDF
          </Button>
        )}
      </div>

      {/* Stats */}
      <GrilleStats colonnes={4}>
        <CarteStat libelle="Inscrits" valeur={data?.inscrits ?? 0} isLoading={isLoading} />
        <CarteStat libelle="Présents" valeur={data?.presents ?? 0} ton="succes" isLoading={isLoading} />
        <CarteStat libelle="Absents" valeur={data?.absents ?? 0} ton="danger" isLoading={isLoading} />
        {/* CreneauStatCard ne porte pas isLoading : la rendre pendant le chargement
            afficherait un taux de 0% et une barre vide, lus comme un vrai resultat.
            D'ou le squelette conserve pour ce seul emplacement. */}
        {isLoading ? (
          <Skeleton className="h-28 rounded-large" />
        ) : (
          <CreneauStatCard label="Taux de présence" value={data?.tauxPresence ?? 0} color="accent" />
        )}
      </GrilleStats>

      {/* Turboys */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Présents */}
        <div className="rounded-xl border border-success-200 bg-success-50/30">
          <div className="flex items-center justify-between border-b border-success-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success-soft-foreground" />
              <h2 className="font-semibold text-sm">Turboys Présents</h2>
            </div>
            {!isLoading && (
              <span className="text-xs font-medium text-success-soft-foreground bg-success-100 rounded-full px-2 py-0.5">
                {data?.presents ?? 0}/{data?.inscrits ?? 0}
              </span>
            )}
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 rounded-lg" />
                ))}
              </div>
            ) : (data?.turboysPresents?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun turboy présent</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data!.turboysPresents.map((t) => (
                  <TurboyBadge key={t.id} turboy={t} variant="present" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Absents */}
        <div className="rounded-xl border border-danger-200 bg-danger-50/30">
          <div className="flex items-center justify-between border-b border-danger-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 text-danger-soft-foreground" />
              <h2 className="font-semibold text-sm">Turboys Absents (Inscrits)</h2>
            </div>
            {!isLoading && (
              <span className="text-xs font-medium text-danger-soft-foreground bg-danger-100 rounded-full px-2 py-0.5">
                {data?.absents ?? 0}/{data?.inscrits ?? 0}
              </span>
            )}
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : (data?.turboysAbsents?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune absence</p>
            ) : (
              <div className="space-y-3">
                {data!.turboysAbsents.map((t) => (
                  <TurboyBadge key={t.id} turboy={t} variant="absent" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analyse rapide */}
      {!isLoading && data?.analyseRapide && (
        <div className="rounded-xl border border-border bg-muted-surface/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="size-4 text-primary" />
            <h3 className="font-semibold text-sm">Analyse rapide</h3>
          </div>
          <p className="text-sm text-muted-foreground">{data.analyseRapide.resume}</p>
          {data.analyseRapide.recommandation && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">Recommandation : </span>
              {data.analyseRapide.recommandation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
