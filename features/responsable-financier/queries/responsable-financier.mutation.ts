'use client';

import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
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

/**
 * 2026-05 (fix incident X-User-Id) — Helper pour récupérer l'UUID du user
 * authentifié depuis la session NextAuth et le propager aux API calls du
 * workflow facture. Sans ce header, l'endpoint backend
 * {@code assignerRecouvrement} throw "X-User-Id est requis" (HTTP 400) ;
 * les autres endpoints du workflow sont permissifs aujourd'hui mais on
 * propage partout pour ne pas avoir à fixer endpoint par endpoint si le
 * backend devient strict, et pour avoir un audit trail "qui a fait quoi"
 * côté logs serveur.
 */
function useCurrentUserId(): string | undefined {
  const { data: session } = useSession();
  return (session?.user as { id?: string } | undefined)?.id;
}

// ─── Valider une facture ───────────────────────────────────────────────────────

export const useValiderFactureRFMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IValiderFactureDTO }) =>
      responsableFinancierAPI.validerFacture(id, data, userId),
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
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: (id: string) => responsableFinancierAPI.viserDg(id, userId),
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
  // 2026-05 (fix prod) — Backend exige X-User-Id sur ce endpoint
  // (assignerRecouvrement throw "X-User-Id est requis" si null). Avant ce
  // fix, l'API acceptait le param userId mais la mutation ne le passait
  // jamais → bouton "Lancer recouvrement" cassé en prod.
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ILancerRecouvrementDTO }) =>
      responsableFinancierAPI.lancerRecouvrement(id, data, userId),
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
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IAjouterPreuveDTO }) =>
      responsableFinancierAPI.ajouterPreuve(id, data, userId),
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
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IDepotPartenaireDTO }) =>
      responsableFinancierAPI.marquerDepotPartenaire(id, data, userId),
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
  // 2026-05 (fix incident X-User-Id) — Même pattern que lancerRecouvrement :
  // l'API acceptait userId optionnel mais la mutation ne le passait pas.
  // Backend permissif aujourd'hui mais on aligne pour cohérence + audit.
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IRejeterDgaDTO }) =>
      responsableFinancierAPI.rejeterDga(id, data, userId),
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

// ─── D3 — Confirmer réception fonds (Comptable / DGA / DG) ──────────────────

/**
 * 2026-05 (fix post-test mardi) — Le Comptable (ou DGA/DG en suppléance)
 * confirme physiquement avoir reçu les fonds versés par le caissier.
 *
 * <p>Émet un event historique + notif DGA + DG côté backend (sans changer
 * le statut métier de la facture pour ne pas bloquer le flow
 * ajouterPreuve → viserDg qui s'enchaîne après).</p>
 *
 * <p>Permission CASL : COMPTABLE + DGA + DG ont le droit. La visibilité du
 * bouton dans l'UI est gérée par `<Can I="manage" a="Finance">`.</p>
 */
export const useConfirmerReceptionComptableMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: (id: string) => responsableFinancierAPI.confirmerReceptionComptable(id, userId),
    onSuccess: async (_data, variables) => {
      await invalidate(pickFactureId(variables));
      toast.success('Réception des fonds confirmée — DGA et DG notifiés');
    },
    onError: (error) => {
      toast.error('Erreur lors de la confirmation de réception', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

// ─── Marquer dépôt banque ─────────────────────────────────────────────────────

export const useDepotBanqueMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IDepotBanqueDTO }) =>
      responsableFinancierAPI.marquerDepotBanque(id, data, userId),
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
