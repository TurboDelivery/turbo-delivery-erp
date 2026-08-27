'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DeliveryFee } from '@/types/price-list';
import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import { useDeliveryFeesByRestaurantQuery } from '../queries/price-list.query';

export type EditModalState = {
  open: boolean;
  selectedFee: DeliveryFee | null;
};

export default function usePriceListTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  // getAllRestaurants relance desormais au lieu de rendre un tableau vide. Sans remonter
  // son echec, le selecteur de restaurant restait muet, aucun selectedKey n'etait pose,
  // et l'ecran affichait "Aucun frais de livraison" alors que les grilles existent.
  const {
    data: allRestaurants = [],
    isError: isRestaurantsError,
    isFetching: isRestaurantsFetching,
    refetch: refetchRestaurants,
  } = useQuery({
    queryKey: ['restaurants', 'all'],
    queryFn: () => getAllRestaurants(),
    staleTime: 5 * 60 * 1000,
  });
  const tabs = allRestaurants.map((r) => ({ id: r.id, nomComplet: r.nomEtablissement }));

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [editModal, setEditModal] = useState<EditModalState>({ open: false, selectedFee: null });

  useEffect(() => {
    if (selectedKey || allRestaurants.length === 0) return;
    const key = searchParams.get('restoId') || allRestaurants[0].id;
    setSelectedKey(key);
  }, [allRestaurants]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentRestaurant = allRestaurants.find((r) => r.id === selectedKey) ?? null;

  const {
    data: feesData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDeliveryFeesByRestaurantQuery(selectedKey, currentPage);

  const deliveryFeesList: DeliveryFee[] = feesData?.content ?? [];
  const meta = { totalItems: feesData?.totalElements ?? 0, totalPages: feesData?.totalPages ?? 0 };

  const handleChangeSelectedKey = (key: string | null) => {
    setSelectedKey(key);
    setCurrentPage(0);
    if (key) {
      params.set('restoId', key);
    } else {
      params.delete('restoId');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleChangePage = (page: number) => {
    if (page - 1 >= 0) setCurrentPage(page - 1);
  };

  const search = searchParams.get('search');
  const deliveryFees = search
    ? deliveryFeesList.filter(
        (item) =>
          item.name?.toLowerCase().includes(search.toLowerCase()) ||
          item.zone.toLowerCase().includes(search.toLowerCase()),
      )
    : deliveryFeesList;

  const openEditModal = useCallback(
    (fee: DeliveryFee) => {
      setEditModal({ open: true, selectedFee: { ...fee, restaurantId: selectedKey ?? fee.restaurantId } });
    },
    [selectedKey],
  );

  const closeEditModal = useCallback(() => {
    setEditModal({ open: false, selectedFee: null });
  }, []);

  // Un seul bouton Reessayer pour les deux lectures. Relancer les frais sans restaurant
  // selectionne appellerait l'endpoint avec un identifiant nul, on s'en abstient.
  const reessayer = () => {
    void refetchRestaurants();
    if (selectedKey) void refetch();
  };

  return {
    selectedKey,
    tabs,
    deliveryFees,
    handleChangeSelectedKey,
    currentRestaurant,
    editModal,
    openEditModal,
    closeEditModal,
    isLoading,
    isFetching: isFetching || isRestaurantsFetching,
    // Sans isError/refetch remontes ici, l'ecran ne peut pas distinguer
    // "ce restaurant n'a aucun frais" d'un appel qui a echoue.
    // Les deux lectures sont fusionnees sous un seul drapeau: l'ecran est faux des que
    // l'une des deux tombe, et l'appelant n'a qu'une zone de donnees a remplacer.
    isError: isError || isRestaurantsError,
    refetch: reessayer,
    pagination: {
      currentPage: currentPage + 1,
      totalPages: meta.totalPages,
      totalItems: meta.totalItems,
      onPageChange: handleChangePage,
    },
  };
}
