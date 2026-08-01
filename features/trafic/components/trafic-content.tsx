'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Chip, Select, SelectItem } from '@heroui/react';
import { LayoutDashboard } from 'lucide-react';

import TraficLivreurPanel from '@/features/trafic/components/trafic-livreur-panel';
import { useTrafic } from '@/features/trafic/hooks/use-trafic';
import { useQuartiersQuery } from '@/features/trafic/queries/quartier.query';
import { TypeLivreur } from '@/types/models';

// Carte du trafic (l'API cartographique a besoin du navigateur → ssr: false).
//
// ⚠ ON RESTE SUR LEAFLET/OSM POUR L'INSTANT, ET C'EST DÉLIBÉRÉ.
// La version Google Maps est écrite et prête (components/dashboard/trafic/MapTrafic.tsx),
// mais la brancher publierait `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` dans le bundle navigateur —
// or cette clé est EXACTEMENT la même que `GOOGLE_API_KEY` utilisée côté serveur pour les
// appels Directions facturés (vérifié : empreintes identiques en production). Aujourd'hui
// aucun composant client ne la consomme réellement, elle ne quitte donc jamais le serveur.
//
// La bascule demande d'abord DEUX clés distinctes dans la console Google Cloud :
//   - une clé NAVIGATEUR restreinte par référent HTTP (*.turbodeliveryapp.com) et limitée à
//     l'API Maps JavaScript → à mettre dans NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ;
//   - une clé SERVEUR restreinte par IP, lue par lib/googlemaps-server.tsx via une variable
//     NON préfixée NEXT_PUBLIC_ (sinon restreindre la clé actuelle par référent casserait
//     l'autocomplétion d'adresse, le géocodage et le calcul de distance des grilles).
// Une fois les deux clés en place, il suffit de remplacer MapLeaflet par MapTrafic ici.
const MapLeaflet = dynamic(() => import('@/components/dashboard/trafic/MapLeaflet'), { ssr: false });

const LEGENDE: { key: keyof TraficCounts; label: string; color: string }[] = [
  { key: 'disponibles', label: 'Disponibles', color: '#16a34a' },
  { key: 'enActivite', label: 'En livraison', color: '#ea580c' },
  { key: 'horsRayon', label: 'Hors rayon', color: '#dc2626' },
  { key: 'indisponibles', label: 'Indisponibles', color: '#6b7280' },
];

type TraficCounts = {
  disponibles: number;
  enActivite: number;
  horsRayon: number;
  indisponibles: number;
};

const TYPES: { value: TypeLivreur; label: string }[] = [
  { value: 'INDEPENDANT', label: 'Indépendant' },
  { value: 'JOURNALIER', label: 'Journalier' },
  { value: 'SUPERVISEUR_LIVREUR', label: 'Superviseur' },
];

export default function TraficContent() {
  const { data, positions, selectedLivreurId, focusPosition, focusOnLivreur, openDashboard, toggleDashboard } = useTrafic();
  const { data: quartiers } = useQuartiersQuery();

  const [filtreQuartier, setFiltreQuartier] = useState<string>('');
  const [filtreType, setFiltreType] = useState<string>('');

  const handleSelectLivreur = useCallback(
    (livreurId: string) => {
      focusOnLivreur(livreurId);
      if (openDashboard) toggleDashboard();
    },
    [focusOnLivreur, openDashboard, toggleDashboard],
  );

  const positionsFiltrees = useMemo(
    () =>
      positions.filter(
        (p) =>
          (!filtreQuartier || p.quartier === filtreQuartier) &&
          (!filtreType || p.typeLivreur === filtreType),
      ),
    [positions, filtreQuartier, filtreType],
  );

  const counts: TraficCounts = {
    disponibles: data.disponibles.total,
    enActivite: data.enActivite.total,
    horsRayon: data.horsRayon.total,
    indisponibles: data.indisponibles.total,
  };

  const quartiersActifs = (quartiers ?? []).filter((q) => q.actif);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-8rem)] min-h-[600px] bg-blue-500 overflow-hidden rounded-xl shadow-md">
      <div className="bg-primary text-white flex justify-between items-center px-4 py-3 shrink-0">
        <h3 className="text-lg 2xl:text-xl font-semibold flex items-center gap-2">ERP-TRAFIC — Suivi temps réel</h3>
        <Chip variant="solid" className="bg-white text-primary font-medium">
          Total : {data.totalLivreurs}
        </Chip>
      </div>

      {/* M4 (RG-33) — légende des statuts + compteurs + filtres quartier/type */}
      <div className="bg-white border-b border-default-100 px-4 py-2 shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-3">
          {LEGENDE.map((l) => (
            <span key={l.key} className="flex items-center gap-1.5 text-xs text-default-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
              <span className="font-semibold text-default-800">{counts[l.key]}</span>
            </span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select
            aria-label="Filtrer par quartier"
            size="sm"
            placeholder="Quartier"
            className="w-40"
            selectedKeys={filtreQuartier ? [filtreQuartier] : []}
            onSelectionChange={(keys) => setFiltreQuartier((Array.from(keys)[0] as string) ?? '')}
          >
            {/* Option "Tous" + quartiers actifs */}
            {[{ libelle: '' }, ...quartiersActifs].map((q) => (
              <SelectItem key={q.libelle} value={q.libelle}>
                {q.libelle === '' ? 'Tous les quartiers' : q.libelle}
              </SelectItem>
            ))}
          </Select>
          <Select
            aria-label="Filtrer par type"
            size="sm"
            placeholder="Type"
            className="w-36"
            selectedKeys={filtreType ? [filtreType] : []}
            onSelectionChange={(keys) => setFiltreType((Array.from(keys)[0] as string) ?? '')}
          >
            {[{ value: '', label: 'Tous les types' }, ...TYPES].map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <MapLeaflet positions={positionsFiltrees} focusPosition={focusPosition} quartiers={quartiersActifs} />

        <div className="absolute inset-x-0 bottom-0 pointer-events-none z-[1000] flex flex-col items-center">
          <AnimatePresence initial={false}>
            {openDashboard && (
              <motion.div
                key="dashboard-panel"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full px-2 sm:px-4 mb-3 pointer-events-auto"
              >
                <TraficLivreurPanel data={data} selectedLivreurId={selectedLivreurId} onSelectLivreur={handleSelectLivreur} onClose={toggleDashboard} />
              </motion.div>
            )}
          </AnimatePresence>

          {!openDashboard && (
            <div className="mb-4 pointer-events-auto">
              <Button onPress={toggleDashboard} color="primary" variant="shadow" startContent={<LayoutDashboard className="w-4 h-4" />}>
                Voir les livreurs
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
