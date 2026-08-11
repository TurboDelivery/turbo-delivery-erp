'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { facturationPlageAPI } from '../apis/facturation-plage.api';
import {
  IConfigurationFacturationDto,
  IFactureGeneree,
  IGenerationPlageDto,
} from '../types/facturation-plage.types';

export const facturationPlageKeys = {
  all: ['facturation-plage'] as const,
  apercu: (restaurantId: string, debut: string, fin: string) =>
    [...facturationPlageKeys.all, 'apercu', restaurantId, debut, fin] as const,
  configuration: () => [...facturationPlageKeys.all, 'configuration'] as const,
};

/**
 * L'aperçu ne se déclenche que quand les trois éléments sont posés. Il n'écrit rien,
 * donc on peut le laisser suivre la saisie ; mais un aperçu lancé sur une plage
 * incomplète produirait un 409 et un toast d'erreur pendant que l'utilisateur tape.
 */
export const useApercuPlageQuery = (
  restaurantId: string | null,
  debut: string | null,
  fin: string | null,
) =>
  useQuery({
    queryKey: facturationPlageKeys.apercu(restaurantId ?? '', debut ?? '', fin ?? ''),
    queryFn: () => facturationPlageAPI.apercu(restaurantId!, debut!, fin!),
    enabled: Boolean(restaurantId && debut && fin && debut <= fin),
    retry: false,
    staleTime: 0,
  });

const messageErreur = (error: unknown) => {
  // Le backend renvoie un 409 dont le message NOMME les factures en conflit. C'est
  // exactement ce que l'utilisateur doit lire : on le remonte tel quel plutôt que de
  // le remplacer par un « Erreur » générique.
  const reponse = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (reponse) return reponse;
  return error instanceof Error ? error.message : 'Erreur inconnue';
};

const resumeFactures = (factures: IFactureGeneree[]) =>
  factures.map((f) => f.code).join(' et ');

export const useGenererPlageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: IGenerationPlageDto) => facturationPlageAPI.generer(dto),
    onSuccess: (factures) => {
      queryClient.invalidateQueries({ queryKey: facturationPlageKeys.all });
      // Les écrans encours et recouvrement lisent d'autres caches : on les invalide
      // aussi, sans quoi la facture n'apparaîtrait qu'au prochain rechargement (RG-09).
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['encours'] });
      queryClient.invalidateQueries({ queryKey: ['recouvrements'] });
      toast.success(
        factures.length > 1
          ? `${factures.length} factures générées : ${resumeFactures(factures)}`
          : `Facture ${factures[0]?.code ?? ''} générée`,
      );
    },
    onError: (error) =>
      toast.error('Génération impossible', { description: messageErreur(error) }),
  });
};

export const useReprendreFactureMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: IGenerationPlageDto) => facturationPlageAPI.reprendre(dto),
    onSuccess: (factures) => {
      queryClient.invalidateQueries({ queryKey: facturationPlageKeys.all });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['encours'] });
      toast.success(`Facture reprise dans l'ERP : ${resumeFactures(factures)}`);
    },
    onError: (error) => toast.error('Reprise impossible', { description: messageErreur(error) }),
  });
};

export const useConfigurationFacturationQuery = () =>
  useQuery({
    queryKey: facturationPlageKeys.configuration(),
    queryFn: () => facturationPlageAPI.listerConfiguration(),
    staleTime: 60 * 1000,
  });

export const useEnregistrerConfigurationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      restaurantId,
      dto,
    }: {
      restaurantId: string;
      dto: IConfigurationFacturationDto;
    }) => facturationPlageAPI.enregistrerConfiguration(restaurantId, dto),
    onSuccess: (partenaire) => {
      queryClient.invalidateQueries({ queryKey: facturationPlageKeys.configuration() });
      toast.success(`Configuration de ${partenaire.nomEtablissement} enregistrée`);
    },
    onError: (error) =>
      toast.error("Échec de l'enregistrement", { description: messageErreur(error) }),
  });
};
