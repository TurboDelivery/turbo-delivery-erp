'use client';

import React, { useState } from 'react';
import { Button, Dropdown, Spinner } from '@heroui-v3/react';
import Link from 'next/link';
import { ChevronDown, Download, Plus } from 'lucide-react';
import { type DemandeAssignationVM, type Restaurant } from '@/types/models';
import { useTurboyFilters, type ActiveTab } from '@/features/turboys/hooks/use-turboy-filters';
import { type TurboyType } from '@/features/turboys/types/turboys.types';
import { turboyAPI } from '@/features/turboys/apis/turboy.api';
import { StatCard } from '@/features/men/components/stat-card';
import { exportTurboysPdf } from '@/features/men/utils/export-pdf';
import { DemandesPanel } from '@/features/men/components/demandes-panel';
import { TurboysPanel } from '@/features/men/components/turboys-panel';
import { useTurboysByTypeQuery } from '@/features/turboys/queries/turboy-list.query';

interface ContentProps {
  demandes: DemandeAssignationVM[];
  restaurants: Restaurant[];
}

export default function Content({
  demandes,
  restaurants,
}: ContentProps) {
  const { filters, setFilters, setTab } = useTurboyFilters();
  const activeCard = filters.tab;
  const [isExporting, setIsExporting] = useState<string | null>(null);
  // Compteurs dynamiques depuis l'API
  const { data: statsData } = useTurboysByTypeQuery({ page: 0, limit: 1 });
  const totalCount = statsData?.totalCount ?? 0;
  const journalierCount = statsData?.journalierCount ?? 0;
  const independantCount = statsData?.independantCount ?? 0;
  // V54 (2026-05) — Nouvelle population SUPERVISEUR_LIVREUR. Optionnel pour
  // rester rétro-compat avec un backend pré-V54.
  const superviseurLivreurCount = statsData?.superviseurLivreurCount ?? 0;
  const demandesCount = statsData?.demandesCount ?? 0;

  async function fetchAllTurboys(typeLivreur?: TurboyType) {
    const PAGE_SIZE = 200;
    const first = await turboyAPI.obtenirTurboyParType({ page: 0, limit: PAGE_SIZE, typeLivreur });
    const totalPages = first.livreurs?.totalPages ?? 1;
    if (totalPages <= 1) return first.livreurs?.content ?? [];

    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        turboyAPI.obtenirTurboyParType({ page: i + 1, limit: PAGE_SIZE, typeLivreur })
      )
    );
    return [...(first.livreurs?.content ?? []), ...remaining.flatMap((r) => r.livreurs?.content ?? [])];
  }

  async function handleExport(type: 'all' | TurboyType) {
    setIsExporting(type);
    try {
      if (type === 'all') {
        // V54 (2026-05) — Inclut aussi les superviseurs-livreurs dans l'export
        // "Tous". La spec demande de préserver la visibilité de toutes les
        // populations (vérification anti-fraude — §5.3 / §6.3 cadrage).
        const [indep, journ, sup] = await Promise.all([
          fetchAllTurboys('INDEPENDANT'),
          fetchAllTurboys('JOURNALIER'),
          fetchAllTurboys('SUPERVISEUR_LIVREUR'),
        ]);
        await exportTurboysPdf([...indep, ...journ, ...sup], undefined);
      } else {
        const turboys = await fetchAllTurboys(type);
        await exportTurboysPdf(turboys, type);
      }
    } finally {
      setIsExporting(null);
    }
  }

  function handleCardClick(card: ActiveTab) {
    if (card === 'all') setFilters((prev) => ({ ...prev, tab: 'all', typeLivreur: null, page: 0 }));
    else if (card === 'journalier') setFilters((prev) => ({ ...prev, tab: 'journalier', typeLivreur: 'JOURNALIER' as TurboyType, page: 0 }));
    else if (card === 'independant') setFilters((prev) => ({ ...prev, tab: 'independant', typeLivreur: 'INDEPENDANT' as TurboyType, page: 0 }));
    // V54 (2026-05) — Nouveau filtre par superviseur-livreur (note de cadrage).
    else if (card === 'superviseur_livreur') setFilters((prev) => ({ ...prev, tab: 'superviseur_livreur', typeLivreur: 'SUPERVISEUR_LIVREUR' as TurboyType, page: 0 }));
    else if (card === 'demandes') setFilters((prev) => ({ ...prev, tab: 'demandes', page: 0 }));
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coursiers ({totalCount})</h1>
          <p className="text-sm text-muted mt-0.5">Gérez tous vos livreurs en un seul endroit</p>
        </div>
        <div className="flex items-center gap-2">
          {/*
           * Le declencheur d'export etait un `<button>` ecrit a la main, avec sa propre
           * bordure `border-default-300`, son propre survol et un anneau tournant fait de
           * deux bordures — une reimplementation du Button et du Spinner de la
           * bibliotheque. Le menu venait de shadcn alors que la v3 a le sien.
           */}
          <Dropdown>
            <Button isDisabled={isExporting !== null} size="sm" variant="outline">
              {isExporting !== null ? (
                <Spinner size="sm" />
              ) : (
                <Download aria-hidden="true" className="size-4" />
              )}
              Exporter PDF
              <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label="Population à exporter"
                onAction={(k) => handleExport(k as 'all' | TurboyType)}
              >
                <Dropdown.Item id="all">Tous les coursiers</Dropdown.Item>
                <Dropdown.Item id="INDEPENDANT">Indépendants</Dropdown.Item>
                <Dropdown.Item id="JOURNALIER">Journaliers</Dropdown.Item>
                {/* V54 (2026-05) — Export de la nouvelle population aligné cadrage DGA. */}
                <Dropdown.Item id="SUPERVISEUR_LIVREUR">Superviseurs-livreurs</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          {/*
           * `color` et `startContent` sont des props de la v2 : sur un Button v3 elles
           * sont ignorees EN SILENCE. Le bouton avait donc perdu son icone « + » et sa
           * couleur de marque sans qu'aucune erreur ne le signale.
           */}
          <Link href="/delivery-men/men/create">
            <Button size="sm" variant="primary">
              <Plus aria-hidden="true" className="size-4" />
              Créer un profil
            </Button>
          </Link>
        </div>
      </div>

      {/* V54 (2026-05) — Grille passée à 5 colonnes pour accueillir la nouvelle
           carte "Superviseurs-livreurs" (note de cadrage DGA 28/05). */}
      <div className="grid grid-cols-2 gap-4 w-full sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total turboys"
          value={totalCount}
          highlight
          isActive={activeCard === 'all'}
          onClick={() => handleCardClick('all')}
        />
        <StatCard
          label="Journaliers"
          value={journalierCount}
          isActive={activeCard === 'journalier'}
          onClick={() => handleCardClick('journalier')}
        />
        <StatCard
          label="Indépendants"
          value={independantCount}
          isActive={activeCard === 'independant'}
          onClick={() => handleCardClick('independant')}
        />
        <StatCard
          label="Superviseurs-livreurs"
          value={superviseurLivreurCount}
          isActive={activeCard === 'superviseur_livreur'}
          onClick={() => handleCardClick('superviseur_livreur')}
        />
        <StatCard
          label="Demandes en cours"
          value={demandesCount}
          isActive={activeCard === 'demandes'}
          onClick={() => handleCardClick('demandes')}
        />
      </div>

      {activeCard === 'demandes' ? (
        <DemandesPanel demandes={demandes} restaurants={restaurants} />
      ) : (
      <TurboysPanel restaurants={restaurants} />
      )}
    </div>
  );
}
