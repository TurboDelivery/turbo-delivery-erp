import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import { DeliveryMan } from '@/types/models';

export function useLivreurs () {
    //TODO:implementation de hook pour les factures pour recuperer les factures
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

export function factureToOptions(factures: any[]) {
  return factures.map((facture) => ({
    label: facture.numero,
    value: facture.id,
  }));
}