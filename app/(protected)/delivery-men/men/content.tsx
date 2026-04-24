'use client';

import React, { useState } from 'react';
import { Button } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Plus } from 'lucide-react';
import { type DemandeAssignationVM, type Restaurant } from '@/types/models';
import { useTurboyFilters, type ActiveTab } from '@/features/turboys/hooks/use-turboy-filters';
import { type TurboyType } from '@/features/turboys/types/turboys.types';
import { turboyAPI } from '@/features/turboys/apis/turboy.api';
import { StatCard } from '@/features/men/components/stat-card';
import { exportTurboysPdf } from '@/features/men/utils/export-pdf';
import { DemandesPanel } from '@/features/men/components/demandes-panel';
import { TurboysPanel } from '@/features/men/components/turboys-panel';
import { useTurboysByTypeQuery } from '@/features/turboys/queries/turboy-list.query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const router = useRouter();

  // Compteurs dynamiques depuis l'API
  const { data: statsData } = useTurboysByTypeQuery({ page: 0, limit: 1 });
  const totalCount = statsData?.totalCount ?? 0;
  const journalierCount = statsData?.journalierCount ?? 0;
  const independantCount = statsData?.independantCount ?? 0;
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
        const [indep, journ] = await Promise.all([
          fetchAllTurboys('INDEPENDANT'),
          fetchAllTurboys('JOURNALIER'),
        ]);
        await exportTurboysPdf([...indep, ...journ], undefined);
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
    else if (card === 'demandes') setFilters((prev) => ({ ...prev, tab: 'demandes', page: 0 }));
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Coursiers ({totalCount})</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez tous vos livreurs en un seul endroit</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex items-center gap-2 rounded-medium border border-default-300 bg-transparent px-3 h-8 text-sm font-medium text-default-700 hover:bg-default-100 transition-colors disabled:opacity-50"
                disabled={isExporting !== null}
              >
                {isExporting !== null ? (
                  <span className="w-4 h-4 animate-spin rounded-full border-2 border-default-400 border-t-transparent" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Exporter PDF
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => handleExport('all')} disabled={isExporting !== null}>
                Tous les coursiers
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport('INDEPENDANT')} disabled={isExporting !== null}>
                Indépendants
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport('JOURNALIER')} disabled={isExporting !== null}>
                Journaliers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/delivery-men/men/create">
            <Button
              color="primary"
              size="sm"
              startContent={<Plus className="w-4 h-4" />}
            >
              Créer un profil
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
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
          label="Demandes en cours"
          value={demandesCount}
          isActive={activeCard === 'demandes'}
          onClick={() => handleCardClick('demandes')}
        />
        <StatCard
          label="Livreurs assignés"
          value={0}
          isActive={false}
          onClick={() => router.push('/delivery-men/assigned')}
          isLink
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
