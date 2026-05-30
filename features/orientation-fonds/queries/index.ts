'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { orientationFondsAPI } from '../apis';
import type { IAttestationCaisseDTO, IOrientationDTO, IReorientationDTO } from '../types';

function useCurrentUserId(): string | undefined {
  const { data: session } = useSession();
  return (session?.user as { id?: string } | undefined)?.id;
}

// Invalide tout ce qui dépend du workflow facture/recouvrement + l'écran de vérif.
function useInvalidateWorkflow() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['responsable-financier'] });
    qc.invalidateQueries({ queryKey: ['caissier'] });
    qc.invalidateQueries({ queryKey: ['orientation-fonds'] });
  };
}

export const orientationFondsKeys = {
  all: ['orientation-fonds'] as const,
  verification: () => [...orientationFondsKeys.all, 'verification'] as const,
  attestations: () => [...orientationFondsKeys.all, 'attestations'] as const,
};

export function useOrienterFondsMutation() {
  const invalidate = useInvalidateWorkflow();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IOrientationDTO }) =>
      orientationFondsAPI.orienter(id, data, userId),
    onSuccess: (vm) => {
      invalidate();
      toast.success(
        vm.statut === 'Conservé en caisse'
          ? 'Fonds conservés en caisse — Comptable et Caissier notifiés'
          : 'Dépôt en banque autorisé — Comptable notifié',
      );
    },
    onError: (e) => toast.error("Erreur lors de l'orientation", {
      description: e instanceof Error ? e.message : 'Erreur inconnue',
    }),
  });
}

export function useReorienterFondsMutation() {
  const invalidate = useInvalidateWorkflow();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IReorientationDTO }) =>
      orientationFondsAPI.reorienter(id, data, userId),
    onSuccess: () => {
      invalidate();
      toast.success('Fonds ré-orientés vers la banque — Comptable notifié');
    },
    onError: (e) => toast.error('Erreur lors de la ré-orientation', {
      description: e instanceof Error ? e.message : 'Erreur inconnue',
    }),
  });
}

export function useEnregistrerAttestationMutation() {
  const invalidate = useInvalidateWorkflow();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: (data: IAttestationCaisseDTO) => orientationFondsAPI.enregistrerAttestation(data, userId),
    onSuccess: (vm) => {
      invalidate();
      if (vm.ecart !== 0) {
        toast.warning(`Attestation enregistrée — écart de ${new Intl.NumberFormat('fr-FR').format(vm.ecart)} FCFA signalé`);
      } else {
        toast.success('Attestation de caisse enregistrée — aucun écart');
      }
    },
    onError: (e) => toast.error("Erreur lors de l'attestation de caisse", {
      description: e instanceof Error ? e.message : 'Erreur inconnue',
    }),
  });
}

export function useVerificationDepotsQuery() {
  return useQuery({
    queryKey: orientationFondsKeys.verification(),
    queryFn: () => orientationFondsAPI.getVerificationDepots(),
    staleTime: 60_000,
  });
}

export function useAttestationsCaisseQuery() {
  return useQuery({
    queryKey: orientationFondsKeys.attestations(),
    queryFn: () => orientationFondsAPI.listAttestations(),
    staleTime: 60_000,
  });
}
