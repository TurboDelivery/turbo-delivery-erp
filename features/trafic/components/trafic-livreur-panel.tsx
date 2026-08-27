'use client';

import { useMemo, useState } from 'react';
import { Input } from '@heroui/react';
import { Search, Users } from 'lucide-react';

import TraficLivreurList from '@/features/trafic/components/trafic-livreur-list';
import { AffecterCourseModal } from '@/features/trafic/components/affecter-course-modal';
import { LivreurTraficVue } from '@/features/trafic/utils/normaliser-trafic';
import { useAbility } from '@/hooks/use-ability';

interface TraficLivreurPanelProps {
  livreurs: LivreurTraficVue[];
  recherche: string;
  onRechercheChange: (valeur: string) => void;
  selectedLivreurId: string | null;
  onSelectLivreur: (livreurId: string) => void;
  isLoading?: boolean;
}

/**
 * Liste latérale du trafic : le registre complet des livreurs correspondant aux
 * filtres, y compris ceux dont on ignore la position. Un livreur sans marqueur
 * sur la carte reste un livreur en service — le masquer serait le mensonge que
 * cette refonte corrige.
 */
export default function TraficLivreurPanel({
  livreurs,
  recherche,
  onRechercheChange,
  selectedLivreurId,
  onSelectLivreur,
  isLoading = false,
}: TraficLivreurPanelProps) {
  const ability = useAbility();
  const canAffecter = ability.can('manage', 'Trafic');

  const [affectLivreur, setAffectLivreur] = useState<LivreurTraficVue | null>(null);
  const [affectOpen, setAffectOpen] = useState(false);

  const onAffecter = canAffecter
    ? (livreur: LivreurTraficVue) => {
        setAffectLivreur(livreur);
        setAffectOpen(true);
      }
    : undefined;

  const sansPosition = useMemo(() => livreurs.filter((l) => !l.aPosition).length, [livreurs]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-default-200/50 bg-white dark:bg-content1">
      <div className="shrink-0 border-b border-default-200/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/10">
            <Users className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Livreurs affichés</p>
            <p className="text-[11px] text-default-500">
              {livreurs.length} livreur{livreurs.length > 1 ? 's' : ''} selon les filtres actifs
            </p>
          </div>
        </div>
        <Input
          size="sm"
          radius="lg"
          className="mt-3"
          aria-label="Rechercher un livreur"
          placeholder="Rechercher un nom, un téléphone…"
          value={recherche}
          onValueChange={onRechercheChange}
          isClearable
          onClear={() => onRechercheChange('')}
          startContent={<Search className="h-4 w-4 text-default-400" aria-hidden />}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TraficLivreurList
          livreurs={livreurs}
          selectedLivreurId={selectedLivreurId}
          onSelect={onSelectLivreur}
          onAffecter={onAffecter}
          isLoading={isLoading}
        />
      </div>

      {sansPosition > 0 && (
        <p className="shrink-0 border-t border-default-200/60 px-4 py-2 text-[11px] text-default-500">
          {sansPosition} livreur{sansPosition > 1 ? 's' : ''} sans position connue — listé
          {sansPosition > 1 ? 's' : ''} ici, sans marqueur sur la carte.
        </p>
      )}

      <AffecterCourseModal livreur={affectLivreur} isOpen={affectOpen} onOpenChange={setAffectOpen} />
    </div>
  );
}
