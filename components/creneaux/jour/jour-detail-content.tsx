'use client';

import { Avatar, Button, Card, Chip } from '@heroui-v3/react';
import { ArrowLeft, CheckCircle2, Download, Lightbulb, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { CreneauStatCard } from '@/components/creneaux/stats/creneau-stat-card';
import { useCreneauDetailJourQuery } from '@/features/creneaux/queries/creneau.query';
import { ICreneauTurboySimple } from '@/features/creneaux/types/creneau.types';
import { createUrlFile, getInitials } from '@/utils/createUrlFile';

import { exportPresenceJournalierePdf } from './presence-journaliere-pdf';

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      year: 'numeric',
    })
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Un livreur dans l'une des deux listes du jour.
 *
 * <p>L'icône de présence était doublée par la colonne où figure la ligne : une coche verte
 * dans la liste « Présents », une croix rouge dans la liste « Absents ». Elle disparaît des
 * lignes ; les deux listes portent leur icône dans leur titre, une seule fois.</p>
 *
 * <p>L'avatar ne montrait jamais la photo : la v2 la prenait en `src`, et la valeur passait
 * dans le vide depuis la bascule. La v3 la veut en `Avatar.Image`.</p>
 */
function LigneTurboy({ absent, turboy }: { absent?: boolean; turboy: ICreneauTurboySimple }) {
  const photo = turboy.avatar ? createUrlFile(turboy.avatar, 'backend') : undefined;

  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-8 shrink-0">
        {photo && <Avatar.Image alt={turboy.nomComplet} src={photo} />}
        <Avatar.Fallback>{getInitials(turboy.nomComplet)}</Avatar.Fallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm leading-tight font-medium text-foreground">
          {turboy.nomComplet}
        </p>
        {absent && <p className="text-xs text-muted">Inscrit, non pointé</p>}
      </div>
    </div>
  );
}

/**
 * Une des deux listes du jour.
 *
 * <p>Chacune était un `&lt;div&gt;` peint à la main : `border-success-200 bg-success-50/30`
 * pour les présents, `border-danger-200 bg-danger-50/30` pour les absents. Un jour normal
 * affichait donc un grand panneau vert et un grand panneau rouge côte à côte, la couleur
 * portée par le CONTENANT et pas par ce qu'il faut regarder. Deux cartes ordinaires, et la
 * teinte reste sur le seul compteur, où elle dit quelque chose.</p>
 */
function ListeTurboys({
  absent,
  enChargement,
  inscrits,
  nombre,
  titre,
  turboys,
  vide,
}: {
  absent?: boolean;
  enChargement: boolean;
  inscrits: number;
  nombre: number;
  titre: string;
  turboys: ICreneauTurboySimple[];
  vide: string;
}) {
  const Icone = absent ? XCircle : CheckCircle2;

  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icone
            aria-hidden="true"
            className={`size-4 ${absent ? 'text-danger' : 'text-success'}`}
          />
          <h2 className="text-sm font-semibold text-foreground">{titre}</h2>
        </div>
        {!enChargement && (
          <Chip color={absent && nombre > 0 ? 'danger' : 'success'} size="sm" variant="soft">
            <Chip.Label>
              {nombre} / {inscrits}
            </Chip.Label>
          </Chip>
        )}
      </Card.Header>
      <Card.Content>
        {enChargement ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="h-8 animate-pulse rounded-lg bg-surface-secondary" key={i} />
            ))}
          </div>
        ) : turboys.length === 0 ? (
          <p className="text-sm text-muted">{vide}</p>
        ) : (
          <div
            className={
              absent ? 'flex flex-col gap-3' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'
            }
          >
            {turboys.map((t) => (
              <LigneTurboy absent={absent} key={t.id} turboy={t} />
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

interface JourDetailContentProps {
  date: string;
}

export function JourDetailContent({ date }: JourDetailContentProps) {
  const { data, isError, isLoading } = useCreneauDetailJourQuery(date);
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
        <XCircle aria-hidden="true" className="size-10 text-danger" />
        <p className="font-semibold text-foreground">Impossible de charger les données</p>
        <p className="text-sm text-muted">
          Une erreur est survenue lors de la récupération des présences du jour.
        </p>
        <Link
          className="mt-2 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
          href="/delivery-men/creneaux"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Retour au planning
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
            href="/delivery-men/creneaux"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour au planning
          </Link>

          {/* Le titre etait peint en ROUGE DE MARQUE : une date n'appelle aucune action. */}
          {isLoading ? (
            <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-secondary" />
          ) : (
            <h1 className="text-2xl font-bold text-foreground">{formatDateLabel(date)}</h1>
          )}
          <p className="text-sm text-muted">Détail de la journée</p>
        </div>
        {!isLoading && (
          <Button
            className="mt-7 shrink-0"
            isPending={isExporting}
            onPress={handleExportPdf}
            size="sm"
            variant="outline"
          >
            <Download aria-hidden="true" className="size-4" />
            Exporter PDF
          </Button>
        )}
      </div>

      <GrilleStats colonnes={4}>
        <CarteStat isLoading={isLoading} libelle="Inscrits" valeur={data?.inscrits ?? 0} />
        <CarteStat
          isLoading={isLoading}
          libelle="Présents"
          ton="succes"
          valeur={data?.presents ?? 0}
        />
        <CarteStat
          isLoading={isLoading}
          libelle="Absents"
          ton="danger"
          valeur={data?.absents ?? 0}
        />
        {/* CreneauStatCard ne porte pas isLoading : la rendre pendant le chargement
            afficherait un taux de 0% et une barre vide, lus comme un vrai resultat.
            D'ou le squelette conserve pour ce seul emplacement. */}
        {isLoading ? (
          <div className="h-28 animate-pulse rounded-xl bg-surface-secondary" />
        ) : (
          <CreneauStatCard color="accent" label="Taux de présence" value={data?.tauxPresence ?? 0} />
        )}
      </GrilleStats>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListeTurboys
          enChargement={isLoading}
          inscrits={data?.inscrits ?? 0}
          nombre={data?.presents ?? 0}
          titre="Présents"
          turboys={data?.turboysPresents ?? []}
          vide="Aucun livreur présent"
        />
        <ListeTurboys
          absent
          enChargement={isLoading}
          inscrits={data?.inscrits ?? 0}
          nombre={data?.absents ?? 0}
          titre="Absents parmi les inscrits"
          turboys={data?.turboysAbsents ?? []}
          vide="Aucune absence"
        />
      </div>

      {!isLoading && data?.analyseRapide && (
        <Card>
          <Card.Content className="gap-2">
            <div className="flex items-center gap-2">
              <Lightbulb aria-hidden="true" className="size-4 text-muted" />
              <h3 className="text-sm font-semibold text-foreground">Analyse rapide</h3>
            </div>
            <p className="text-sm text-muted">{data.analyseRapide.resume}</p>
            {data.analyseRapide.recommandation && (
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">Recommandation : </span>
                {data.analyseRapide.recommandation}
              </p>
            )}
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
