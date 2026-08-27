'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import { useSession } from 'next-auth/react';
import { useAbility } from '@casl/react';
import { useCreneauxListQuery } from '@/features/creneaux/queries/creneau.query';
import { AbilityContext } from '@/lib/casl/ability-context';
import {
  useGrillePaiementQuery,
  useModifierInclusionMutation,
  useSoumettreGrilleMutation,
  useUpdateNumeroWaveMutation,
  useValiderLigneMutation,
  useValiderToutesLignesMutation,
  useCloturerCreneauMutation,
  useAnnulerClotureMutation,
} from '../queries/grille-paiement.query';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';
import { grillePaiementFiltersConfig, grillePaiementFiltersOptions } from '../filters/grille-paiement.filters';

export default function useGrillePaiement() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';
  const ability = useAbility(AbilityContext);
  // V54 — Seul COMPTABLE (et 'manage all' DG) peut overrider. Permission CASL
  // déclarée dans ability.ts : can('update-inclusion', 'GrillePaiement').
  const canEditInclusion = ability.can('update-inclusion', 'GrillePaiement');

  const [filters, setFilters] = useQueryStates(grillePaiementFiltersConfig, grillePaiementFiltersOptions);
  const selectedCreneauId = filters.creneauId || undefined;
  const page = filters.page;
  const { data: creneauList, isLoading: isLoadingCreneaux } = useCreneauxListQuery();
  const creneaux = creneauList?.content ?? [];

  const { data: grille, isLoading, isError, refetch } = useGrillePaiementQuery({ creneauId: selectedCreneauId, page });
  const { mutate: soumettre, isPending: isSoumettant } = useSoumettreGrilleMutation();
  const { mutate: persistWave } = useUpdateNumeroWaveMutation();
  const { mutate: validerLigne, isPending: isValidating } = useValiderLigneMutation();
  const { mutate: validerToutesLignes, isPending: isValidantTout } = useValiderToutesLignesMutation();
  const { mutate: cloturerCreneau, isPending: isCloturant } = useCloturerCreneauMutation();
  const { mutate: annulerCloture, isPending: isAnnulantCloture } = useAnnulerClotureMutation();
  const { mutate: modifierInclusion, isPending: isModifyingInclusion } = useModifierInclusionMutation();

  const [selectedLigne, setSelectedLigne] = useState<IGrillePaiementLigne | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [annulerClotureOpen, setAnnulerClotureOpen] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [waveOverrides, setWaveOverrides] = useState<Map<string, string>>(new Map());
  const [ligneAValider, setLigneAValider] = useState<IGrillePaiementLigne | null>(null);
  // V54 (2026-05) — State de la modale justification inclusion.
  // {@code nextValue} = état cible (true = inclure, false = exclure).
  const [inclusionRequest, setInclusionRequest] = useState<{
    ligne: IGrillePaiementLigne;
    nextValue: boolean;
  } | null>(null);

  const lotStatut = grille?.lot?.statut;
  // Le footer "Soumettre au DGA" + l'édition des lignes restent disponibles
  // tant que le lot n'a pas atteint le DGA. CALCUL_EN_COURS est un état
  // intermédiaire (calcul/préparation) AVANT SOUMIS_DGA : on le laisse
  // "déverrouillé" pour permettre l'étape 2 (soumettre-dga) et la validation
  // des lignes — sinon un lot bloqué en CALCUL_EN_COURS n'aurait plus aucun
  // bouton pour repartir vers le DGA.
  const STATUTS_SOUMETTABLES = ['EN_ATTENTE', 'REJETE', 'CALCUL_EN_COURS'];
  const isLotVerrouille = !!grille?.lot && !STATUTS_SOUMETTABLES.includes(lotStatut ?? '');

  // Statut du CRÉNEAU (≠ statut du lot) : clôturable tant qu'il n'est pas verrouillé.
  const creneauCourant = creneaux.find((c: any) => c.id === (selectedCreneauId ?? grille?.id));
  const creneauStatut = (creneauCourant as any)?.statut as string | undefined;
  const canCloturer = creneauStatut === 'OUVERT' || creneauStatut === 'TOLERANCE';
  const handleCloturerCreneau = () => {
    const creneauId = selectedCreneauId ?? grille?.id;
    if (!creneauId || !canCloturer || isCloturant) return;
    cloturerCreneau({ creneauId, userId });
  };

  // V137 — Annulation de la clôture, réservée à l'administrateur.
  //
  // Le gate ne passe PAS par CASL : `normalizeRole` alias ADMIN sur DG
  // (ability.ts), donc aucune règle CASL ne sait distinguer un administrateur
  // d'un DG. On compare donc le libellé brut de la session, normalisé exactement
  // comme le fait `GardeSupervision` côté backend, pour que les deux gardes
  // répondent la même chose et qu'on n'affiche pas un bouton qui finira en 403.
  const roleSession = session?.user?.role as unknown as string | { libelle?: string } | null | undefined;
  const roleLibelle = typeof roleSession === 'string' ? roleSession : roleSession?.libelle ?? '';
  // Le compte administrateur de l'ERP porte le rôle DG dans l'annuaire, pas « ADMIN » :
  // se limiter à ADMIN reviendrait à cacher le bouton à l'administrateur lui-même.
  // Même liste que GardeSupervision.ROLES_ADMINISTRATEUR côté backend, pour ne jamais
  // afficher un bouton qui finirait en 403.
  const ROLES_ADMINISTRATION = ['ADMIN', 'ADMINISTRATEUR', 'DG', 'DIRECTEURGENERAL', 'PDG'];
  const roleNormalise = roleLibelle.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const isAdmin = ROLES_ADMINISTRATION.includes(roleNormalise);

  // SOLDE est exclu volontairement : la paie a été versée, il n'y a plus rien à rouvrir.
  const creneauEstCloture = creneauStatut === 'VERROUILLE_V2' || creneauStatut === 'VERROUILLE_AUTO';
  const canAnnulerCloture = isAdmin && creneauEstCloture;
  const handleAnnulerCloture = (motif: string) => {
    const creneauId = selectedCreneauId ?? grille?.id;
    if (!creneauId || !canAnnulerCloture || isAnnulantCloture) return;
    annulerCloture({ creneauId, userId, motif }, { onSuccess: () => setAnnulerClotureOpen(false) });
  };

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
  // V58 — lignes encore en attente de validation comptable (flag_attente).
  const lignesAValider = grille?.stats.lignesAValider ?? 0;

  // La soumission au DGA exige (mêmes préconditions que soumettreDga) :
  //  - aucun numéro Wave manquant,
  //  - toutes les lignes validées (flag_attente = false).
  const canSoumettre = !!grille && waveManquants === 0 && lignesAValider === 0;

  const handleSoumettre = () => {
    if (!grille || !canSoumettre) return;
    setConfirmOpen(true);
  };

  // Certification GROUPÉE : crée/valide toutes les lignes du lot d'un coup.
  // Sans ça, il fallait valider chaque livreur individuellement (les lignes
  // n'existent en base qu'à la validation) avant de pouvoir soumettre au DGA.
  const handleToutValider = () => {
    if (!grille?.lot?.id || isValidantTout) return;
    validerToutesLignes({ lotId: grille.lot.id, userId });
  };

  const handleValiderLigne = (ligne: IGrillePaiementLigne) => setLigneAValider(ligne);

  const handleConfirmerValidation = () => {
    if (!ligneAValider || !grille?.lot?.id) return;
    validerLigne(
      { lotId: grille.lot.id, turboyId: ligneAValider.turboy.id, userId },
      { onSuccess: () => setLigneAValider(null) },
    );
  };

  // V54 — Comptable demande à toggle l'inclusion → on ouvre la modale
  // justification. La mutation n'est tirée qu'à la confirmation.
  const handleRequestToggleInclusion = (ligne: IGrillePaiementLigne, nextValue: boolean) => {
    setInclusionRequest({ ligne, nextValue });
  };

  const handleConfirmerInclusion = (justification: string) => {
    if (!inclusionRequest || !grille?.lot?.id) return;
    modifierInclusion(
      {
        params: {
          lotId: grille.lot.id,
          turboyId: inclusionRequest.ligne.turboy.id,
          inclus: inclusionRequest.nextValue,
          justification,
        },
        userId,
      },
      { onSuccess: () => setInclusionRequest(null) },
    );
  };

  const handleConfirmerSoumission = () => {
    if (!grille) return;
    soumettre(
      { creneauId: grille.id, lotId: grille.lot?.id, statut: lotStatut, userId },
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
    isError,
    refetch,
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
    isValidantTout,
    handleToutValider,
    canCloturer,
    isCloturant,
    handleCloturerCreneau,
    canAnnulerCloture,
    isAnnulantCloture,
    handleAnnulerCloture,
    annulerClotureOpen,
    setAnnulerClotureOpen,
    updateWave,
    waveManquants,
    lignesAValider,
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
    // V54 (2026-05) — Override inclusion ligne par le Comptable.
    canEditInclusion,
    inclusionRequest,
    isModifyingInclusion,
    handleRequestToggleInclusion,
    handleConfirmerInclusion,
    closeInclusionRequest: () => setInclusionRequest(null),
  };
}
