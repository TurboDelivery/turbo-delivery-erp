'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCreneauxListQuery } from '@/features/creneaux/queries/creneau.query';
import { useGrillePaiementQuery, useSoumettreGrilleMutation } from '../queries/grille-paiement.query';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';

export default function useGrillePaiement() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  const [selectedCreneauId, setSelectedCreneauId] = useState<string | undefined>(undefined);
  const { data: creneauList, isLoading: isLoadingCreneaux } = useCreneauxListQuery();
  const creneaux = creneauList?.content ?? [];

  const { data: grille, isLoading } = useGrillePaiementQuery({ creneauId: selectedCreneauId });
  const { mutate: soumettre, isPending: isSoumettant } = useSoumettreGrilleMutation();

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [selectedLigne, setSelectedLigne] = useState<IGrillePaiementLigne | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [soumis, setSoumis] = useState(false);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allChecked =
    !!grille && grille.lignes.length > 0 && grille.lignes.every((l) => checkedIds.has(l.id));

  const toggleAll = () => {
    if (!grille) return;
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(grille.lignes.map((l) => l.id)));
  };

  const canSoumettre =
    !!grille &&
    grille.stats.waveManquants === 0 &&
    allChecked;

  const handleSoumettre = () => {
    if (!grille || !canSoumettre) return;
    setConfirmOpen(true);
  };

  const handleConfirmerSoumission = (note: string) => {
    if (!grille) return;
    soumettre(
      { lotId: grille.id, userId },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setCommentaire('');
          setSoumis(true);
        },
      },
    );
  };

  const totalTickets = grille?.lignes.reduce((s, l) => s + l.tickets, 0) ?? 0;
  const totalBrut = grille?.lignes.reduce((s, l) => s + l.brut, 0) ?? 0;
  const totalDeductions = grille?.lignes.reduce((s, l) => s + l.deductions, 0) ?? 0;
  const totalNet = grille?.lignes.reduce((s, l) => s + l.netAPayer, 0) ?? 0;

  return {
    grille,
    isLoading,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId,
    checkedIds,
    toggleCheck,
    allChecked,
    toggleAll,
    canSoumettre,
    isSoumettant,
    handleSoumettre,
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
