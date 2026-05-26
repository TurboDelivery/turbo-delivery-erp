'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { responsableFinancierAPI } from '../apis/responsable-financier.api';
import {
  IAjouterPreuveDTO,
  IDepotBanqueDTO,
  IDepotPartenaireDTO,
  ILancerRecouvrementDTO,
  IRejeterDgaDTO,
  IValiderFactureDTO,
} from '../types/responsable-financier.types';
import { useInvalidateFacturesRFQuery } from './responsable-financier.query';

/**
 * Fix B1 (2026-05) : helper pour extraire l'id de facture à passer à
 * {@link useInvalidateFacturesRFQuery}, qui invalide à la fois la liste et
 * le détail spécifique de la facture modifiée. Couvre les 2 signatures
 * mutationFn présentes ici : (id: string) et ({ id, data }).
 */
function pickFactureId(variables: string | { id?: string } | undefined): string | undefined {
  if (typeof variables === 'string') return variables;
  return variables?.id;
}

// ─── Valider une facture ───────────────────────────────────────────────────────

export const useValiderFactureRFMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IValiderFactureDTO }) =>
      responsableFinancierAPI.validerFacture(id, data),
    onSuccess: async (_data, variables) => {
      // Fix B1 : passer l'id pour invalider précisément le détail de la
      // facture modifiée (en plus des listes). Avant : seule la liste était
      // invalidée, le détail spécifique servait un cache stale (et donc
      // affichait l'ancien agent "Medard").
      await invalidate(pickFactureId(variables));
      toast.success('Facture validée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la validation', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

// ─── Viser DG ─────────────────────────────────────────────────────────────────

export const useViserDgMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();

  return useMutation({
    mutationFn: (id: string) => responsableFinancierAPI.viserDg(id),
    onSuccess: async (_data, variables) => {
      // Fix B1 : passer l'id pour invalider précisément le détail de la
      // facture modifiée (en plus des listes). Avant : seule la liste était
      // invalidée, le détail spécifique servait un cache stale (et donc
      // affichait l'ancien agent "Medard").
      await invalidate(pickFactureId(variables));
      toast.success('Facture visée par le DG');
    },
    onError: (error) => {
      toast.error('Erreur lors du visa DG', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

// ─── Lancer le recouvrement ────────────────────────────────────────────────────

export const useLancerRecouvrementMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ILancerRecouvrementDTO }) =>
      responsableFinancierAPI.lancerRecouvrement(id, data),
    onSuccess: async (_data, variables) => {
      // Fix B1 : passer l'id pour invalider précisément le détail de la
      // facture modifiée (en plus des listes). Avant : seule la liste était
      // invalidée, le détail spécifique servait un cache stale (et donc
      // affichait l'ancien agent "Medard").
      await invalidate(pickFactureId(variables));
      toast.success('Recouvrement lancé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors du lancement du recouvrement', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

// ─── Ajouter une preuve ────────────────────────────────────────────────────────

export const useAjouterPreuveMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IAjouterPreuveDTO }) =>
      responsableFinancierAPI.ajouterPreuve(id, data),
    onSuccess: async (_data, variables) => {
      // Fix B1 : passer l'id pour invalider précisément le détail de la
      // facture modifiée (en plus des listes). Avant : seule la liste était
      // invalidée, le détail spécifique servait un cache stale (et donc
      // affichait l'ancien agent "Medard").
      await invalidate(pickFactureId(variables));
      toast.success('Preuve ajoutée avec succès');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout de la preuve", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

// ─── Marquer dépôt partenaire ─────────────────────────────────────────────────

export const useDepotPartenaireMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IDepotPartenaireDTO }) =>
      responsableFinancierAPI.marquerDepotPartenaire(id, data),
    onSuccess: async (_data, variables) => {
      // Fix B1 : passer l'id pour invalider précisément le détail de la
      // facture modifiée (en plus des listes). Avant : seule la liste était
      // invalidée, le détail spécifique servait un cache stale (et donc
      // affichait l'ancien agent "Medard").
      await invalidate(pickFactureId(variables));
      toast.success('Dépôt partenaire enregistré');
    },
    onError: (error) => {
      toast.error('Erreur lors du dépôt partenaire', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

// ─── Rejeter DGA ──────────────────────────────────────────────────────────────

/**
 * Fix build pré-existant (2026-05) : validation-dga-view.tsx importait
 * `useRejeterDgaMutation` qui n'était pas exporté. `tsc --noEmit` laissait
 * passer (warning), mais `pnpm run build` (Next.js) fail strict sur cet
 * import manquant. Ajout du hook manquant pour débloquer le deploy prod.
 *
 * Le service backend est déjà câblé : PATCH /factures/{id}/rejeter-dga avec
 * { motif } dans le body (cf. responsableFinancierAPI.rejeterDga).
 */
export const useRejeterDgaMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IRejeterDgaDTO }) =>
      responsableFinancierAPI.rejeterDga(id, data),
    onSuccess: async (_data, variables) => {
      await invalidate(pickFactureId(variables));
      toast.success('Facture rejetée par le DGA');
    },
    onError: (error) => {
      toast.error('Erreur lors du rejet DGA', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

// ─── Marquer dépôt banque ─────────────────────────────────────────────────────

export const useDepotBanqueMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IDepotBanqueDTO }) =>
      responsableFinancierAPI.marquerDepotBanque(id, data),
    onSuccess: async (_data, variables) => {
      // Fix B1 : passer l'id pour invalider précisément le détail de la
      // facture modifiée (en plus des listes). Avant : seule la liste était
      // invalidée, le détail spécifique servait un cache stale (et donc
      // affichait l'ancien agent "Medard").
      await invalidate(pickFactureId(variables));
      toast.success('Dépôt banque enregistré');
    },
    onError: (error) => {
      toast.error('Erreur lors du dépôt banque', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
