'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { socket } from '@/socket';
import { traficKeyQuery } from '@/features/trafic/queries/index.query';
import {
  LivreurTrafic,
  TraficLivreursResponse,
  traficVide,
} from '@/features/trafic/types/trafic.type';

const TRAFIC_EVENT = '/trafic/livreur/';

/** Buckets du trafic à patcher lorsqu'un livreur émet une nouvelle position. */
const BUCKETS = [
  'disponibles',
  'enActivite',
  'enPause',
  'horsService',
  'horsRayon',
  'indisponibles',
] as const;

function patchInCategorie(liste: LivreurTrafic[], updated: LivreurTrafic): LivreurTrafic[] {
  const exists = liste.some((l) => l.livreurId === updated.livreurId);
  if (!exists) return liste;
  return liste.map((l) => (l.livreurId === updated.livreurId ? { ...l, ...updated } : l));
}

export function useRealtimeTrafic() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onTraficLivreurEvent = (value: any) => {
      let updated: LivreurTrafic;
      try {
        updated = typeof value === 'string' ? (JSON.parse(value) as LivreurTrafic) : (value as LivreurTrafic);
      } catch {
        return;
      }
      if (!updated?.livreurId) return;

      queryClient.setQueryData<TraficLivreursResponse>(traficKeyQuery('livreurs'), (prev) => {
        const base = prev ?? traficVide();
        const suivant: TraficLivreursResponse = { ...base };
        BUCKETS.forEach((bucket) => {
          const categorie = base[bucket] ?? { total: 0, liste: [] };
          suivant[bucket] = { ...categorie, liste: patchInCategorie(categorie.liste, updated) };
        });
        return suivant;
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(TRAFIC_EVENT, onTraficLivreurEvent);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(TRAFIC_EVENT, onTraficLivreurEvent);
    };
  }, [queryClient]);

  return { isConnected };
}
