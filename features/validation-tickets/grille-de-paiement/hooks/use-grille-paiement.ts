'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCreneauxListQuery } from '@/features/creneaux/queries/creneau.query';
import { useGrillePaiementQuery, useSoumettreGrilleMutation, useUpdateNumeroWaveMutation } from '../queries/grille-paiement.query';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';

export default function useGrillePaiement() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  const [selectedCreneauId, setSelectedCreneauId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const { data: creneauList, isLoading: isLoadingCreneaux } = useCreneauxListQuery();
  const creneaux = creneauList?.content ?? [];

  const { data: grille, isLoading } = useGrillePaiementQuery({ creneauId: selectedCreneauId, page });
  const { mutate: soumettre, isPending: isSoumettant } = useSoumettreGrilleMutation();
  const { mutate: persistWave } = useUpdateNumeroWaveMutation();

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [selectedLigne, setSelectedLigne] = useState<IGrillePaiementLigne | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [soumis, setSoumis] = useState(false);
  const [waveOverrides, setWaveOverrides] = useState<Map<string, string>>(new Map());

  const handleCreneauChange = useCallback((id: string | undefined) => {
    setSelectedCreneauId(id);
    setPage(0);
  }, []);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateWave = (turboyId: string, value: string) => {
    setWaveOverrides((prev) => new Map(prev).set(turboyId, value));
    const creneauId = selectedCreneauId ?? grille?.id;
    if (creneauId) {
      persistWave(
        { creneauId, turboyId, numeroWave: value },
        {
          onError: () => {
            setWaveOverrides((prev) => {
              const next = new Map(prev);
              next.delete(turboyId);
              return next;
            });
          },
        },
      );
    }
  };

  // Lignes merged with local wave overrides for optimistic UI
  const lignes: IGrillePaiementLigne[] = useMemo(
    () =>
      (grille?.lignes ?? []).map((l) => {
        const override = waveOverrides.get(l.turboy.id);
        if (override === undefined) return l;
        return { ...l, numeroWave: override, statut: override.trim() !== '' ? 'OK' : 'WAVE_MANQUANT' };
      }),
    [grille?.lignes, waveOverrides],
  );

  const waveManquants = grille?.stats.waveManquants ?? 0;

  const allChecked = !!grille && lignes.length > 0 && lignes.every((l) => checkedIds.has(l.id));

  const toggleAll = () => {
    if (!grille) return;
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(lignes.map((l) => l.id)));
  };

  const canSoumettre = !!grille && waveManquants === 0 && allChecked;

  const handleSoumettre = () => {
    if (!grille || !canSoumettre) return;
    setConfirmOpen(true);
  };

  const handleConfirmerSoumission = () => {
    if (!grille) return;
    soumettre(
      { creneauId: grille.id, userId },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setCommentaire('');
          setSoumis(true);
        },
      },
    );
  };

  return {
    grille,
    lignes,
    isLoading,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId: handleCreneauChange,
    page,
    setPage,
    totalPages: grille?.pagination.totalPages ?? 1,
    checkedIds,
    toggleCheck,
    allChecked,
    toggleAll,
    canSoumettre,
    isSoumettant,
    handleSoumettre,
    updateWave,
    waveManquants,
    selectedLigne,
    openDetail: setSelectedLigne,
    closeDetail: () => setSelectedLigne(null),
    confirmOpen,
    closeConfirm: () => setConfirmOpen(false),
    commentaire,
    setCommentaire,
    handleConfirmerSoumission,
    soumis,
  };
}
