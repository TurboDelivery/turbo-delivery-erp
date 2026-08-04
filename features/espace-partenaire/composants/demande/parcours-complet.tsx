'use client';

import { useState } from 'react';
import { Button, Input, Spinner, Tab, Tabs } from '@heroui/react';
import { List, Radar, RotateCcw, Search } from 'lucide-react';

import { useProfilPartenaire } from '@/features/espace-partenaire/composants/coquille-partenaire';

import RadarZones from './radar-zones';
import { formaterFcfa, type Zone } from './types';

/**
 * PARCOURS COMPLET (EF-02) : choix de la zone de livraison.
 * ≥ sm : deux vues commutables Radar | Liste. < sm : « échelle des tarifs »,
 * un bandeau par palier avec les zones en chips tactiles.
 */
export default function ParcoursComplet({
  zones,
  chargement,
  erreur,
  onRecharger,
  onChoisir,
}: {
  zones: Zone[];
  chargement: boolean;
  erreur: string | null;
  onRecharger: () => void;
  onChoisir: (zone: Zone) => void;
}) {
  const profil = useProfilPartenaire();
  const [vue, setVue] = useState<'radar' | 'liste'>('radar');
  const [recherche, setRecherche] = useState('');

  if (chargement) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white">
        <Spinner color="primary" label="Chargement des zones…" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-center">
        <p className="text-sm text-gray-600">{erreur}</p>
        <Button
          variant="flat"
          color="primary"
          className="h-12 font-semibold"
          startContent={<RotateCcw className="h-4 w-4" aria-hidden />}
          onPress={onRecharger}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  const requete = recherche.trim().toLowerCase();
  const correspond = (zone: Zone) =>
    !requete || `${zone.nom} ${zone.zone}`.toLowerCase().includes(requete);
  const zonesFiltrees = zones.filter(correspond);

  const paliers = Array.from(new Set(zones.map((z) => z.tarifFcfa))).sort((a, b) => a - b);
  const legendePalier = (tarif: number) => {
    const indice = paliers.indexOf(tarif);
    if (indice === 0) return 'autour de votre store';
    if (indice === paliers.length - 1) return 'les plus éloignées';
    return `palier ${indice + 1}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Recherche (EF-02.6, si plus de 10 zones) + bascule de vue (≥ sm) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {zones.length > 10 ? (
          <Input
            value={recherche}
            onValueChange={setRecherche}
            isClearable
            size="lg"
            variant="bordered"
            placeholder="Rechercher une zone (ex. Cocody, Plateau…)"
            startContent={<Search className="h-4 w-4 text-gray-400" aria-hidden />}
            className="max-w-md"
            aria-label="Rechercher une zone"
          />
        ) : (
          <span />
        )}
        <div className="hidden sm:block">
          <Tabs
            selectedKey={vue}
            onSelectionChange={(cle) => setVue(cle as 'radar' | 'liste')}
            size="md"
            radius="full"
            aria-label="Affichage des zones"
          >
            <Tab
              key="radar"
              title={
                <span className="flex items-center gap-1.5">
                  <Radar className="h-4 w-4" aria-hidden /> Radar
                </span>
              }
            />
            <Tab
              key="liste"
              title={
                <span className="flex items-center gap-1.5">
                  <List className="h-4 w-4" aria-hidden /> Liste
                </span>
              }
            />
          </Tabs>
        </div>
      </div>

      {/* ≥ sm : radar ou liste */}
      <div className="hidden sm:block">
        {vue === 'radar' ? (
          <RadarZones
            zones={zones}
            storeNom={profil.storeNom}
            storeLatitude={profil.storeLatitude}
            storeLongitude={profil.storeLongitude}
            recherche={recherche}
            onChoisir={onChoisir}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
            {zonesFiltrees.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => onChoisir(zone)}
                className="flex min-h-[64px] items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-800">{zone.nom}</span>
                  <span className="block truncate text-xs text-gray-400">{zone.zone}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-primary">
                  {formaterFcfa(zone.tarifFcfa)} F
                </span>
              </button>
            ))}
            {zonesFiltrees.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-gray-400">
                Aucune zone ne correspond à cette recherche.
              </p>
            )}
          </div>
        )}
      </div>

      {/* < sm : échelle des tarifs, un bandeau par palier */}
      <div className="flex flex-col gap-3 sm:hidden">
        {paliers.map((tarif) => {
          const zonesDuPalier = zonesFiltrees.filter((z) => z.tarifFcfa === tarif);
          if (zonesDuPalier.length === 0) return null;
          return (
            <div key={tarif} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-sm font-extrabold text-gray-900">{formaterFcfa(tarif)} FCFA</span>
                <span className="text-[11px] font-medium text-gray-400">{legendePalier(tarif)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {zonesDuPalier.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => onChoisir(zone)}
                    className="min-h-[48px] rounded-full border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-700 transition-colors active:border-primary active:text-primary"
                  >
                    {zone.nom}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {zonesFiltrees.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            Aucune zone ne correspond à cette recherche.
          </p>
        )}
      </div>
    </div>
  );
}
