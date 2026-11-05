'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { virementsAPI } from '../apis/virements.api';
import { ICreerPayeur, ICreerVirement, IEnregistrerParametre } from '../types/virements.types';
import { useInvalidateVirements } from './virements.query';

export const useCreerVirementMutation = () => {
  const invalidate = useInvalidateVirements();
  return useMutation({
    mutationFn: (dto: ICreerVirement) => virementsAPI.creerVirement(dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Virement enregistré');
    },
    // ⚠ Le message du serveur est AFFICHÉ tel quel : il nomme la référence en double
    // et le virement qui la porte déjà. Le remplacer par « une erreur est survenue »
    // obligerait l'opérateur à chercher lui-même ce qu'il vient de ressaisir.
    onError: (error) =>
      toast.error("Ce virement n'a pas été enregistré", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
  });
};

export const useAnnulerVirementMutation = () => {
  const invalidate = useInvalidateVirements();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      virementsAPI.annulerVirement(id, motif),
    onSuccess: async () => {
      await invalidate();
      toast.success('Virement annulé');
    },
    onError: (error) =>
      toast.error("L'annulation a échoué", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
  });
};

export const useCreerPayeurMutation = () => {
  const invalidate = useInvalidateVirements();
  return useMutation({
    mutationFn: (dto: ICreerPayeur) => virementsAPI.creerPayeur(dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Payeur créé');
    },
    onError: (error) =>
      toast.error("Le payeur n'a pas été créé", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
  });
};

export const useEnregistrerParametreMutation = () => {
  const invalidate = useInvalidateVirements();
  return useMutation({
    mutationFn: (dto: IEnregistrerParametre) => virementsAPI.enregistrerParametre(dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Paramètres enregistrés');
    },
    onError: (error) =>
      toast.error("Les paramètres n'ont pas été enregistrés", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
  });
};
