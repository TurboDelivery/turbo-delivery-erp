'use client';

import { useQuery } from '@tanstack/react-query';

import { traficKeyQuery } from '@/features/trafic/queries/index.query';
import { getPointagesEnAttenteRequest } from '@/features/trafic/request/pointages-attente.request';

const RAFRAICHISSEMENT_MS = 30_000;

/** File d'arbitrage des pointages hors-zone — alimente le bandeau d'action. */
export const usePointagesEnAttenteQuery = () =>
  useQuery({
    queryKey: traficKeyQuery('pointages-attente'),
    queryFn: getPointagesEnAttenteRequest,
    staleTime: RAFRAICHISSEMENT_MS,
    refetchInterval: RAFRAICHISSEMENT_MS,
    refetchIntervalInBackground: false,
  });
