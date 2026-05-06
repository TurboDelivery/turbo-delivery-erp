'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useVisaDgaQuery,
  useViserEtTransmettreMutation,
  useRejeterEtRenvoyerMutation,
} from '../queries/visa-dga.query';

export default function useVisaDga() {
  const router = useRouter();
  const { data: creneau, isLoading } = useVisaDgaQuery();
  const { mutate: viser, isPending: isVisant } = useViserEtTransmettreMutation();
  const { mutate: rejeter, isPending: isRejetant } = useRejeterEtRenvoyerMutation();

  const [rejetOpen, setRejetOpen] = useState(false);
  const [viserOpen, setViserOpen] = useState(false);
  const [motif, setMotif] = useState('');
  const [vise, setVise] = useState(false);

  const handleViser = () => {
    if (!creneau) return;
    viser(creneau.id, {
      onSuccess: () => {
        setVise(true);
        setViserOpen(false);
      },
    });
  };

  const handleRejeter = () => {
    if (!creneau || !motif.trim()) return;
    rejeter(
      { creneauId: creneau.id, motif: motif.trim() },
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
    isVisant,
    isRejetant,
    vise,
    rejetOpen,
    viserOpen,
    motif,
    setMotif,
    openRejet: () => setRejetOpen(true),
    closeRejet: () => {
      setRejetOpen(false);
      setMotif('');
    },
    openViser: () => setViserOpen(true),
    closeViser: () => setViserOpen(false),
    handleViser,
    handleRejeter,
    handleVoirGrille,
  };
}
