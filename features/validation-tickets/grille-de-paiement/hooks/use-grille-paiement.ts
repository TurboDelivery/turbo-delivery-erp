'use client';

import { useState } from 'react';
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
  // turboyId → numeroWave override (local edits not yet persisted to backend)
  const [waveOverrides, setWaveOverrides] = useState<Map<string, string>>(new Map());

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateWave = (turboyId: string, value: string) => {
    // Optimistic local update
    setWaveOverrides((prev) => new Map(prev).set(turboyId, value));
    // Persist to backend (requires the active creneauId)
    const creneauId = selectedCreneauId ?? grille?.id;
    if (creneauId) {
      persistWave(
        { creneauId, turboyId, numeroWave: value },
        {
          onError: () => {
            // Revert on failure
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

  // Lignes merged with local wave overrides
  const lignes: IGrillePaiementLigne[] = (grille?.lignes ?? []).map((l) => {
    const override = waveOverrides.get(l.turboy.id);
    if (override === undefined) return l;
    return {
      ...l,
      numeroWave: override,
      statut: override.trim() !== '' ? 'OK' : 'WAVE_MANQUANT',
    };
  });

  const waveManquantsComputed = lignes.filter((l) => l.statut === 'WAVE_MANQUANT').length;

  const allChecked =
    !!grille && lignes.length > 0 && lignes.every((l) => checkedIds.has(l.id));

  const toggleAll = () => {
    if (!grille) return;
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(lignes.map((l) => l.id)));
  };

  const canSoumettre =
    !!grille &&
    waveManquantsComputed === 0 &&
    allChecked;

  const handleSoumettre = () => {
    if (!grille || !canSoumettre) return;
    setConfirmOpen(true);
  };

  const handleConfirmerSoumission = (note: string) => {
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

  const totalTickets = lignes.reduce((s, l) => s + l.tickets, 0);
  const totalBrut = lignes.reduce((s, l) => s + l.brut, 0);
  const totalDeductions = lignes.reduce((s, l) => s + l.deductions, 0);
  const totalNet = lignes.reduce((s, l) => s + l.netAPayer, 0);

  return {
    grille,
    lignes,
    isLoading,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId: (id: string | undefined) => { setSelectedCreneauId(id); setPage(0); },
    page,
    setPage,
    totalPages: grille?.pagination.totalPages ?? 1,
    totalElements: grille?.pagination.totalElements ?? 0,
    checkedIds,
    toggleCheck,
    allChecked,
    toggleAll,
    canSoumettre,
    isSoumettant,
    handleSoumettre,
    updateWave,
    waveManquants: waveManquantsComputed,
    totaux: { tickets: totalTickets, brut: totalBrut, deductions: totalDeductions, net: totalNet },
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
