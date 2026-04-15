'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTraficQuery } from '@/features/trafic/queries/trafic.query';
import { useRealtimeTrafic } from '@/features/trafic/hooks/use-realtime-trafic';
import {
  EMPTY_TRAFIC_RESPONSE,
  LivreurTrafic,
  TraficLivreursResponse,
} from '@/features/trafic/types/trafic.type';

interface UseTraficOptions {
  initialData?: TraficLivreursResponse;
  enableRealtime?: boolean;
}

export function useTrafic({ initialData, enableRealtime = true }: UseTraficOptions = {}) {
  const query = useTraficQuery(initialData);
  const realtime = useRealtimeTrafic();

  const data: TraficLivreursResponse = useMemo(
    () => query.data ?? EMPTY_TRAFIC_RESPONSE,
    [query.data],
  );

  const positions = useMemo<LivreurTrafic[]>(
    () =>
      [...data.disponibles.liste, ...data.enActivite.liste].filter(
        (l) => l.position.latitude !== 0 && l.position.longitude !== 0,
      ),
    [data],
  );

  const [selectedLivreurId, setSelectedLivreurId] = useState<string | null>(null);
  const [openDashboard, setOpenDashboard] = useState<boolean>(false);

  const toggleDashboard = useCallback(() => setOpenDashboard((prev) => !prev), []);
  const handleLivreurSelect = useCallback(
    (livreurId: string | null) => setSelectedLivreurId(livreurId),
    [],
  );

  const selectedLivreur = useMemo(() => {
    if (!selectedLivreurId) return null;
    return (
      data.enActivite.liste.find((l) => l.livreurId === selectedLivreurId) ||
      data.disponibles.liste.find((l) => l.livreurId === selectedLivreurId) ||
      data.indisponibles.liste.find((l) => l.livreurId === selectedLivreurId) ||
      null
    );
  }, [data, selectedLivreurId]);

  const [focusTick, setFocusTick] = useState(0);

  const focusPosition = useMemo<[number, number, number] | null>(() => {
    if (!selectedLivreur) return null;
    const { latitude, longitude } = selectedLivreur.position;
    if (latitude === 0 && longitude === 0) return null;
    return [latitude, longitude, focusTick];
  }, [selectedLivreur, focusTick]);

  const focusOnLivreur = useCallback(
    (livreurId: string) => {
      setSelectedLivreurId(livreurId);
      setFocusTick((t) => t + 1);
    },
    [],
  );

  return {
    data,
    positions,
    selectedLivreurId,
    selectedLivreur,
    focusPosition,
    focusOnLivreur,
    openDashboard,
    toggleDashboard,
    handleLivreurSelect,
    isLoading: query.isLoading,
    isError: query.isError,
    isRealtimeConnected: enableRealtime ? realtime.isConnected : false,
  };
}
