import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import { DeliveryMan } from '@/types/models';

export function useLivreurs () {
  const {
    data: livreurs,
    isLoading: isLoadingLivreurs,
    isError: isErrorLivreurs,
    refetch: refetchLivreurs,
  } = useLivreursListQuery();

  return {
    livreurs: livreurs || [],
    isLoadingLivreurs,
    isErrorLivreurs,
    refetchLivreurs,
  };
}

export function livreursToOptions(livreurs: DeliveryMan[]) {
  return livreurs.map((livreur) => ({
    label: livreur.nom + ' ' + livreur.prenoms,
    value: livreur.id,
  }));
}