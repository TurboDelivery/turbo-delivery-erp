'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { socket } from '@/socket';
import { traficKeyQuery } from '@/features/trafic/queries/index.query';
import {
  EMPTY_TRAFIC_RESPONSE,
  LivreurTrafic,
  TraficLivreursResponse,
} from '@/features/trafic/types/trafic.type';

const TRAFIC_EVENT = '/trafic/livreur/';

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

      queryClient.setQueryData<TraficLivreursResponse>(traficKeyQuery('livreurs'), (prev) => {
        const base = prev ?? { ...EMPTY_TRAFIC_RESPONSE };
        return {
          ...base,
          disponibles: { ...base.disponibles, liste: patchInCategorie(base.disponibles.liste, updated) },
          enActivite: { ...base.enActivite, liste: patchInCategorie(base.enActivite.liste, updated) },
          indisponibles: {
            ...base.indisponibles,
            liste: patchInCategorie(base.indisponibles.liste, updated),
          },
        };
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
