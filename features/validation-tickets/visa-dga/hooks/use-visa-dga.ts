'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCreneauxListQuery } from '@/features/creneaux/queries/creneau.query';
import {
  useVisaDgaQuery,
  useViserEtTransmettreMutation,
  useRejeterEtRenvoyerMutation,
} from '../queries/visa-dga.query';

export default function useVisaDga() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  const [selectedCreneauId, setSelectedCreneauId] = useState<string | undefined>(undefined);
  const { data: creneauList, isLoading: isLoadingCreneaux } = useCreneauxListQuery();
  const creneaux = creneauList?.content ?? [];

  const { data: creneau, isLoading } = useVisaDgaQuery(selectedCreneauId);
  const { mutate: viser, isPending: isVisant } = useViserEtTransmettreMutation();
  const { mutate: rejeter, isPending: isRejetant } = useRejeterEtRenvoyerMutation();

  const [rejetOpen, setRejetOpen] = useState(false);
  const [viserOpen, setViserOpen] = useState(false);
  const [motif, setMotif] = useState('');
  const [vise, setVise] = useState(false);

  const handleCreneauChange = useCallback((id: string | undefined) => setSelectedCreneauId(id), []);

  const handleViser = () => {
    if (!creneau?.lotId || creneau.statut !== 'CALCUL_EN_COURS') return;
    viser({ lotId: creneau.lotId, userId }, {
      onSuccess: () => {
        setVise(true);
        setViserOpen(false);
      },
    });
  };

  const handleRejeter = () => {
    if (!creneau?.lotId || !motif.trim() || creneau.statut !== 'CALCUL_EN_COURS') return;
    rejeter(
      { lotId: creneau.lotId, motif: motif.trim(), userId },
      {
        onSuccess: () => {
          setRejetOpen(false);
          setMotif('');
        },
      },
    );
  };

  const handleVoirGrille = () => {
    router.push('/validation-tickets/grille-de-paiement');
  };

  return {
    creneau,
    isLoading,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId: handleCreneauChange,
    isVisant,
    isRejetant,
    vise,
    rejetOpen,
    viserOpen,
    motif,
    setMotif,
    openRejet: () => setRejetOpen(true),
    closeRejet: () => { setRejetOpen(false); setMotif(''); },
    openViser: () => setViserOpen(true),
    closeViser: () => setViserOpen(false),
    handleViser,
    handleRejeter,
    handleVoirGrille,
  };
}
