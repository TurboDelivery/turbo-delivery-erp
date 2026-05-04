'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getPriceListByRestaurant } from '@/src/price-list/price-list.action';
import { DeliveryFee, RestaurantDefini } from '@/types/price-list';
import { useCallback, useEffect, useState } from 'react';
import { getDetailRestaurant } from '@/src/restaurants/restaurants.actions';
import { IRestaurant } from '@/features/restaurants';

export type EditModalState = {
  open: boolean;
  selectedFee: DeliveryFee | null;
};

interface Props {
  initialData: RestaurantDefini[];
}

export default function usePriceListTable({ initialData }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const tabs = initialData.map((r) => ({ id: r.id, nomComplet: r.nomEtablissement }));
  const initialSelectedKey = searchParams.get('restoId') || (initialData.length > 0 ? initialData[0].id : null);

  const [selectedKey, setSelectedKey] = useState<string | null>(initialSelectedKey);
  const [currentRestaurant, setCurrentRestaurant] = useState<IRestaurant | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [meta, setMeta] = useState({ totalItems: 0, totalPages: 0 });
  const [deliveryFeesList, setDeliveryFeesList] = useState<DeliveryFee[]>([]);
  const [editModal, setEditModal] = useState<EditModalState>({ open: false, selectedFee: null });

  useEffect(() => {
    if (!selectedKey && initialData.length > 0) setSelectedKey(initialData[0].id);
  }, [initialData, selectedKey]);

  const handleChangeSelectedKey = (key: string) => {
    setSelectedKey(key);
    params.set('restoId', key);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (!selectedKey) return;
    getDetailRestaurant(selectedKey).then((d) => { if (d) setCurrentRestaurant(d); });
  }, [selectedKey]);

  const handleFetchDeliveryFee = useCallback(
    async (restaurantId: string) => {
      const data = await getPriceListByRestaurant(restaurantId, currentPage, 10);
      if (data) {
        setDeliveryFeesList(data.content);
        setMeta({ totalItems: data.totalElements, totalPages: data.totalPages });
      }
    },
    [currentPage],
  );

  useEffect(() => {
    if (currentRestaurant) handleFetchDeliveryFee(currentRestaurant.id);
  }, [currentRestaurant, handleFetchDeliveryFee]);

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

  const openEditModal = useCallback((fee: DeliveryFee) => {
    setEditModal({ open: true, selectedFee: fee });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModal({ open: false, selectedFee: null });
  }, []);

  return {
    selectedKey,
    tabs,
    deliveryFees,
    handleFetchDeliveryFee,
    handleChangeSelectedKey,
    currentRestaurant,
    editModal,
    openEditModal,
    closeEditModal,
    pagination: {
      currentPage: currentPage + 1,
      totalPages: meta.totalPages,
      totalItems: meta.totalItems,
      onPageChange: handleChangePage,
    },
  };
}
