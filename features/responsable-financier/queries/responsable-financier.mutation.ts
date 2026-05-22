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
  IValiderFactureDTO,
} from '../types/responsable-financier.types';
import { useInvalidateFacturesRFQuery } from './responsable-financier.query';

// ─── Valider une facture ───────────────────────────────────────────────────────

export const useValiderFactureRFMutation = () => {
  const invalidate = useInvalidateFacturesRFQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IValiderFactureDTO }) =>
      responsableFinancierAPI.validerFacture(id, data),
    onSuccess: async () => {
      await invalidate();
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
    onSuccess: async () => {
      await invalidate();
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
  const { data: session } = useSession();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ILancerRecouvrementDTO }) =>
      responsableFinancierAPI.lancerRecouvrement(id, data, session?.user?.id),
    onSuccess: async () => {
      await invalidate();
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
    onSuccess: async () => {
      await invalidate();
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
    onSuccess: async () => {
      await invalidate();
      toast.success('Dépôt partenaire enregistré');
    },
    onError: (error) => {
      toast.error('Erreur lors du dépôt partenaire', {
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
    onSuccess: async () => {
      await invalidate();
      toast.success('Dépôt banque enregistré');
    },
    onError: (error) => {
      toast.error('Erreur lors du dépôt banque', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
