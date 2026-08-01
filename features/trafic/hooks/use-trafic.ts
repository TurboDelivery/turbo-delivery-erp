'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTraficQuery } from '@/features/trafic/queries/trafic.query';
import { useRealtimeTrafic } from '@/features/trafic/hooks/use-realtime-trafic';
import { StatutTrafic, TraficLivreursResponse } from '@/features/trafic/types/trafic.type';
import {
  LivreurTraficVue,
  normaliserTrafic,
} from '@/features/trafic/utils/normaliser-trafic';
import { STATUTS_ORDONNES } from '@/features/trafic/utils/statut-trafic';

export type FiltreStatut = StatutTrafic | 'TOUS';

export interface FiltresTrafic {
  statut: FiltreStatut;
  /** Interrupteur transverse : ne garder que les livreurs loin de leur poste. */
  horsZoneSeulement: boolean;
  quartier: string;
  type: string;
  recherche: string;
}

const FILTRES_INITIAUX: FiltresTrafic = {
  statut: 'TOUS',
  horsZoneSeulement: false,
  quartier: '',
  type: '',
  recherche: '',
};

interface UseTraficOptions {
  initialData?: TraficLivreursResponse;
  enableRealtime?: boolean;
}

export function useTrafic({ initialData, enableRealtime = true }: UseTraficOptions = {}) {
  const query = useTraficQuery(initialData);
  const realtime = useRealtimeTrafic();

  // Un seul modèle pour tout l'écran : compteurs, liste et carte lisent la même
  // liste normalisée, donc ils ne peuvent plus se contredire.
  const trafic = useMemo(() => normaliserTrafic(query.data), [query.data]);

  const [filtres, setFiltres] = useState<FiltresTrafic>(FILTRES_INITIAUX);

  const majFiltre = useCallback(
    <K extends keyof FiltresTrafic>(cle: K, valeur: FiltresTrafic[K]) =>
      setFiltres((prev) => ({ ...prev, [cle]: valeur })),
    [],
  );

  const reinitialiserFiltres = useCallback(() => setFiltres(FILTRES_INITIAUX), []);

  const livreursFiltres = useMemo<LivreurTraficVue[]>(() => {
    const recherche = filtres.recherche.trim().toLowerCase();
    return trafic.livreurs
      .filter((l) => (filtres.statut === 'TOUS' ? true : l.statut === filtres.statut))
      .filter((l) => (filtres.horsZoneSeulement ? l.horsRayonPoste : true))
      .filter((l) => (filtres.quartier ? l.quartier === filtres.quartier : true))
      .filter((l) => (filtres.type ? l.typeLivreur === filtres.type : true))
      .filter((l) =>
        recherche
          ? `${l.nomComplet ?? ''} ${l.telephone ?? ''}`.toLowerCase().includes(recherche)
          : true,
      )
      .sort((a, b) => {
        // Lecture de haut en bas : d'abord ceux qui peuvent travailler, puis
        // dans la file l'ordre de service (N°1 en premier), enfin l'alphabet.
        const rangStatutA = STATUTS_ORDONNES.indexOf(a.statut);
        const rangStatutB = STATUTS_ORDONNES.indexOf(b.statut);
        if (rangStatutA !== rangStatutB) return rangStatutA - rangStatutB;
        const rangA = a.rangFile ?? Number.MAX_SAFE_INTEGER;
        const rangB = b.rangFile ?? Number.MAX_SAFE_INTEGER;
        if (rangA !== rangB) return rangA - rangB;
        return (a.nomComplet ?? '').localeCompare(b.nomComplet ?? '');
      });
  }, [trafic.livreurs, filtres]);

  /**
   * Marqueurs de la carte : uniquement les livreurs dont on connaît la position.
   * Les autres restent dans la liste latérale, marqués « position inconnue » —
   * un livreur sans GPS n'est pas un livreur absent.
   */
  const positions = useMemo<LivreurTraficVue[]>(
    () =>
      livreursFiltres.filter(
        (l) =>
          l.aPosition &&
          (l.position.latitude !== 0 || l.position.longitude !== 0) &&
          // Les HORS SERVICE ne sont pas plantés sur la carte tant qu'on ne les demande
          // pas : ils restent visibles dans la liste avec leur statut, mais les afficher
          // par défaut noierait les quelques livreurs en service sous toute la flotte au
          // repos — et le cadrage automatique dézoomerait sur la ville entière, à l'heure
          // précise où l'écran doit servir.
          (filtres.statut === 'HORS_SERVICE' || l.statut !== 'HORS_SERVICE'),
      ),
    [livreursFiltres, filtres.statut],
  );

  const [selectedLivreurId, setSelectedLivreurId] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);

  const selectedLivreur = useMemo(
    () => trafic.livreurs.find((l) => l.livreurId === selectedLivreurId) ?? null,
    [trafic.livreurs, selectedLivreurId],
  );

  const focusPosition = useMemo<[number, number, number] | null>(() => {
    if (!selectedLivreur?.aPosition) return null;
    const { latitude, longitude } = selectedLivreur.position;
    if (latitude === 0 && longitude === 0) return null;
    return [latitude, longitude, focusTick];
  }, [selectedLivreur, focusTick]);

  const focusOnLivreur = useCallback((livreurId: string) => {
    setSelectedLivreurId((prev) => (prev === livreurId ? prev : livreurId));
    setFocusTick((t) => t + 1);
  }, []);

  return {
    trafic,
    livreursFiltres,
    positions,
    filtres,
    majFiltre,
    reinitialiserFiltres,
    selectedLivreurId,
    selectedLivreur,
    focusPosition,
    focusOnLivreur,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    dataUpdatedAt: query.dataUpdatedAt,
    isRealtimeConnected: enableRealtime ? realtime.isConnected : false,
  };
}
