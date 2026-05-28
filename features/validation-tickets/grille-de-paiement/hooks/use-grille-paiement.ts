'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import { useSession } from 'next-auth/react';
import { useCreneauxListQuery } from '@/features/creneaux/queries/creneau.query';
import { useGrillePaiementQuery, useSoumettreGrilleMutation, useUpdateNumeroWaveMutation, useValiderLigneMutation } from '../queries/grille-paiement.query';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';
import { grillePaiementFiltersConfig, grillePaiementFiltersOptions } from '../filters/grille-paiement.filters';

export default function useGrillePaiement() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  const [filters, setFilters] = useQueryStates(grillePaiementFiltersConfig, grillePaiementFiltersOptions);
  const selectedCreneauId = filters.creneauId || undefined;
  const page = filters.page;
  const { data: creneauList, isLoading: isLoadingCreneaux } = useCreneauxListQuery();
  const creneaux = creneauList?.content ?? [];

  const { data: grille, isLoading } = useGrillePaiementQuery({ creneauId: selectedCreneauId, page });
  const { mutate: soumettre, isPending: isSoumettant } = useSoumettreGrilleMutation();
  const { mutate: persistWave } = useUpdateNumeroWaveMutation();
  const { mutate: validerLigne, isPending: isValidating } = useValiderLigneMutation();

  const [selectedLigne, setSelectedLigne] = useState<IGrillePaiementLigne | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [waveOverrides, setWaveOverrides] = useState<Map<string, string>>(new Map());
  const [ligneAValider, setLigneAValider] = useState<IGrillePaiementLigne | null>(null);

  const lotStatut = grille?.lot?.statut;
  const isLotVerrouille = !!grille?.lot && lotStatut !== 'EN_ATTENTE';

  const handleCreneauChange = useCallback((id: string | undefined) => {
    setFilters({ creneauId: id ?? '', page: 0 });
  }, [setFilters]);

  const handlePageChange = useCallback((p: number) => {
    setFilters({ page: p });
  }, [setFilters]);

  const updateWave = (turboyId: string, value: string) => {
    setWaveOverrides((prev) => new Map(prev).set(turboyId, value));
    const creneauId = selectedCreneauId ?? grille?.id;
    if (!creneauId || !value.trim()) return;
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
      (grille?.lignes.content ?? []).map((l) => {
        const override = waveOverrides.get(l.turboy.id);
        if (override === undefined) return l;
        return { ...l, numeroWave: override, statut: override.trim() !== '' ? 'OK' : 'WAVE_MANQUANT' };
      }),
    [grille?.lignes.content, waveOverrides],
  );

  const waveManquants = grille?.stats.waveManquants ?? 0;

  const canSoumettre = !!grille && waveManquants === 0;

  const handleSoumettre = () => {
    if (!grille || !canSoumettre) return;
    setConfirmOpen(true);
  };

  const handleValiderLigne = (ligne: IGrillePaiementLigne) => setLigneAValider(ligne);

  const handleConfirmerValidation = () => {
    if (!ligneAValider || !grille?.lot?.id) return;
    validerLigne(
      { lotId: grille.lot.id, turboyId: ligneAValider.turboy.id, userId },
      { onSuccess: () => setLigneAValider(null) },
    );
  };

  const handleConfirmerSoumission = () => {
    if (!grille) return;
    soumettre(
      { creneauId: grille.id, userId },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setCommentaire('');
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
    setPage: handlePageChange,
    totalPages: grille?.lignes.totalPages ?? 1,
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
    isLotVerrouille,
    lotStatut,
    ligneAValider,
    handleValiderLigne,
    handleConfirmerValidation,
    closeConfirmValidation: () => setLigneAValider(null),
    isValidating,
  };
}
