'use client';

import React, { useState } from 'react';
import { Button } from '@heroui/react';
import Link from 'next/link';
import { Download, Plus } from 'lucide-react';
import { type DemandeAssignationVM, type Restaurant } from '@/types/models';
import { useTurboyFilters } from '@/features/turboys/hooks/use-turboy-filters';
import { type TurboyType } from '@/features/turboys/types/turboys.types';
import { turboyAPI } from '@/features/turboys/apis/turboy.api';
import { StatCard } from '@/features/men/components/stat-card';
import { exportTurboysPdf } from '@/features/men/utils/export-pdf';
import { DemandesPanel } from '@/features/men/components/demandes-panel';
import { TurboysPanel } from '@/features/men/components/turboys-panel';

type ActiveCard = 'all' | 'journalier' | 'independant' | 'demandes';

interface ContentProps {
  totalCount: number;
  journalierCount: number;
  independantCount: number;
  demandesCount: number;
  demandes: DemandeAssignationVM[];
  restaurants: Restaurant[];
}

export default function Content({
  totalCount,
  journalierCount,
  independantCount,
  demandesCount,
  demandes,
  restaurants,
}: ContentProps) {
  const { filters, setFilters } = useTurboyFilters();
  const [activeCard, setActiveCard] = useState<ActiveCard>('all');
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await turboyAPI.obtenirTurboyParType({
        limit: 1000,
        page: 0,
        typeLivreur: (filters.typeLivreur as TurboyType) || undefined,
      });
      exportTurboysPdf(res.content, filters.typeLivreur || undefined);
    } finally {
      setIsExporting(false);
    }
  }

  function handleCardClick(card: ActiveCard) {
    setActiveCard(card);
    if (card === 'all') setFilters((prev) => ({ ...prev, typeLivreur: '' as TurboyType, page: 0 }));
    else if (card === 'journalier') setFilters((prev) => ({ ...prev, typeLivreur: 'JOURNALIER' as TurboyType, page: 0 }));
    else if (card === 'independant') setFilters((prev) => ({ ...prev, typeLivreur: 'INDEPENDANT' as TurboyType, page: 0 }));
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
          <Button
            variant="bordered"
            size="sm"
            startContent={<Download className="w-4 h-4" />}
            isLoading={isExporting}
            onPress={handleExport}
          >
            Exporter PDF
          </Button>
          <Button
            as={Link}
            href="/delivery-men/men/create"
            color="primary"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
          >
            Créer un profil
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap">
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
      </div>

      {activeCard === 'demandes' ? (
        <DemandesPanel demandes={demandes} restaurants={restaurants} />
      ) : (
        <TurboysPanel />
      )}
    </div>
  );
}
