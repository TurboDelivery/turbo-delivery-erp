'use client';
import { Tooltip } from '@/components/heroui';
import { IconEdit } from '@tabler/icons-react';
import { useCallback } from 'react';
import { DeliveryFee } from '@/types/price-list';
import { ZoneActifSwitch, ZoneHistoriqueButton } from '@/features/zones-demande-coursier';
import PriceListeTools from './price-list-tools';

export const priceListColumns = [
  { name: 'Nom', uid: 'name' },
  { name: 'Zone', uid: 'zone' },
  { name: 'Distance', uid: 'distance' },
  { name: 'Coût de livraison', uid: 'prix' },
  { name: 'Commission', uid: 'commission' },
  { name: 'Active', uid: 'actif' },
  { name: 'Action', uid: 'actions' },
];

interface RenderCellProps {
  currentRestaurant: { typeCommission?: string | null } | null;
  onEdit: (fee: DeliveryFee) => void;
}

export function usePriceListRenderCell({ currentRestaurant, onEdit }: RenderCellProps) {
  return useCallback(
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
              {currentRestaurant?.typeCommission === 'POURCENTAGE'
                ? ' (%)'
                : currentRestaurant?.typeCommission === 'FIXE'
                  ? ' (XOF)'
                  : ' (type non défini)'}
            </span>
          );
        case 'actif':
          return <ZoneActifSwitch fraisId={deliveryFee.id} actif={deliveryFee.actif} />;
        case 'actions':
          return (
            <div className="relative flex items-center gap-2">
              <ZoneHistoriqueButton fraisId={deliveryFee.id} zoneLabel={deliveryFee.name || deliveryFee.zone} />
              <Tooltip content="Modifier">
                <button
                  type="button"
                  className="text-lg text-default-400 cursor-pointer active:opacity-50"
                  onClick={() => onEdit(deliveryFee)}
                >
                  <IconEdit />
                </button>
              </Tooltip>
              <Tooltip color="danger" content="Supprimer">
                <PriceListeTools id={deliveryFee.id ?? ''} />
              </Tooltip>
            </div>
          );
        default:
          return null;
      }
    },
    [currentRestaurant?.typeCommission, onEdit],
  );
}
