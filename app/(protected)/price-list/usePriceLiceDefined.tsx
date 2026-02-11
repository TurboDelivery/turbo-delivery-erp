'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getPriceListByRestaurant } from '@/src/price-list/price-list.action';
import { DeliveryFee, RestaurantDefini } from '@/types/price-list';
import { Tooltip } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import FormUpDate from '@/components/dashboard/price-liste/FormUpDate';
import PriceListeTools from '@/components/dashboard/price-liste/price-list-tools';
import { getDetailRestaurant } from '@/src/restaurants/restaurants.actions';
import { IRestaurant } from '@/features/restaurants';

interface Props {
  initialData: RestaurantDefini[];
}

export const columns = [
  { name: 'Nom', uid: 'name' },
  { name: 'Zone', uid: 'zone' },
  { name: 'Distance', uid: 'distance' },
  { name: 'Coût de livraison', uid: 'prix' },
  { name: 'Commission', uid: 'commission' },
  { name: 'Action', uid: 'actions' },
];

export default function usePriceLiceDefined({ initialData }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const tabs = initialData.map((resto) => ({ id: resto.id, nomComplet: resto.nomEtablissement }));
  const initialSelectedKey = searchParams.get('restoId') || (initialData.length > 0 ? initialData[0].id : null);
  const [selectedKey, setSelectedKey] = useState<string | null>(initialSelectedKey);
  const [currentRestaurant, setCurrentRestaurant] = useState<IRestaurant | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [meta, setMeta] = useState({ totalItems: 0, totalPages: 0 });

  useEffect(() => {
    if (!selectedKey && initialData.length > 0) {
      setSelectedKey(initialData[0].id);
    }
  }, [initialData, selectedKey]);

  const handleChangeSelectedKey = (key: string) => {
    setSelectedKey(key);
    params.set('restoId', key);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    async function fetchDetailRestaurant() {
      if (selectedKey) {
        const detailRestaurant = await getDetailRestaurant(selectedKey);
        if (detailRestaurant) {
          setCurrentRestaurant(detailRestaurant);
        }
      }
    }
    fetchDetailRestaurant();
  }, [selectedKey]);

  const [initialDataPriceList, setInitialDataPriceList] = useState<DeliveryFee[]>([]);

  const handleFetchDeliveryFee = useCallback(
    async (restaurantId: string) => {
      const data = await getPriceListByRestaurant(restaurantId, currentPage, 10);
      if (data) {
        setInitialDataPriceList(data.content);
        setMeta({
          totalItems: data.totalElements,
          totalPages: data.totalPages,
        });
      }
    },
    [currentPage],
  );

  const handleChangePage = (page: number) => {
    // S'assurer que la page est valide
    if (page - 1 >= 0) {
      setCurrentPage(page - 1);
    }
  };

  useEffect(() => {
    if (currentRestaurant) {
      handleFetchDeliveryFee(currentRestaurant.id);
    }
  }, [currentRestaurant, handleFetchDeliveryFee]);

  // Recherche
  const search = searchParams.get('search');
  const deliveryFees = search
    ? initialDataPriceList.filter((item) => item.name?.toLowerCase().includes(search.toLowerCase()) || item.zone.toLowerCase().includes(search.toLowerCase()))
    : initialDataPriceList;

  const renderCell = useCallback(
    (deliveryFee: DeliveryFee, columnKey: string) => {
      switch (columnKey) {
        case 'name':
          return <span>{deliveryFee.name}</span>;
        case 'zone':
          return <span>{deliveryFee.zone}</span>;
        case 'distance':
          return <span>{deliveryFee.distanceFin} Km</span>;
        case 'prix':
          return <span>{deliveryFee.prix} (XOF)</span>;
        case 'commission':
          return (
            <span>
              {deliveryFee.commission}
              {currentRestaurant?.typeCommission === 'POURCENTAGE' ? ' (POURCENTAGE %)' : currentRestaurant?.typeCommission === 'FIXE' ? ' (XOF)' : ' (type non défini)'}
            </span>
          );
        case 'actions':
          return (
            <div className="relative flex items-center gap-2">
              <Tooltip content="Edit user">
                <FormUpDate typeCm={currentRestaurant?.typeCommission ?? ''} initialData={deliveryFee} restaurantId={selectedKey || ''} />
              </Tooltip>
              <Tooltip color="danger" content="Delete user">
                <PriceListeTools id={deliveryFee.id || ''} />
              </Tooltip>
            </div>
          );
        default:
          return null;
      }
    },
    [currentRestaurant?.typeCommission, selectedKey],
  );

  return {
    columns,
    selectedKey,
    tabs,
    deliveryFees,
    handleFetchDeliveryFee,
    handleChangeSelectedKey,
    renderCell,
    pagination: {
      currentPage: currentPage + 1,
      totalPages: meta.totalPages,
      totalItems: meta.totalItems,
      onPageChange: handleChangePage,
    },
  };
}
