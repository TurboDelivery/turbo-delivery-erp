import { getPriceListByRestaurant } from '@/src/price-list/price-list.action';
import { PaginatedResponse } from '@/types';
import { DeliveryFee } from '@/types/delivery-fee.model';
import Select, { SingleValue } from 'react-select';
import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '@/types/bon-livraison.model';

type PriceListSelectProps = {
  ticketId: string;
  restaurantID: string;
  handleChange: (id: string, patch: Partial<Ticket>) => void;
};

const PriceListSelect = ({ ticketId, restaurantID, handleChange }: PriceListSelectProps) => {
  const [priceList, setPriceList] = useState<DeliveryFee[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  useEffect(() => {
    const fetchPriceList = async () => {
      const result: PaginatedResponse<DeliveryFee> | null = await getPriceListByRestaurant(restaurantID, 0, 100);
      if (result) {
        setPriceList(result.content); // ou result.data selon ta structure
      }
    };

    fetchPriceList();
  }, [restaurantID]);

  const opts = useMemo(() => getOptsFees(priceList), [priceList]);
  const onChange = (option: SingleValue<{ value: string; label: string }>) => {
    setSelectedFeeId(option?.value ?? null);
    const fee = priceList.find((fee) => getId(fee) == option?.value);
    const livraison = fee?.prix ?? 0;
    const prix = fee?.commission ?? 0;
    console.log('Selected fee:', fee?.name, 'Livraison:', livraison, 'Prix:', prix);
    if (fee) {
      handleChange(ticketId, {
        zoneId: getId(fee),
        nomZone: fee.name ?? '',
        montantLivraison: livraison.toString(),
        coutLivraison: prix.toString(),
      });
    }
  };

  return (
    <div>
      <Select
        options={opts}
        value={opts.find((o) => o.value == selectedFeeId) ?? null}
        onChange={(option) => onChange(option)}
        placeholder="Sélectionner une zone"
        isClearable
        className="text-xs text-wrap min-w-52 rounded px-2 py-1"
        classNamePrefix="react-select"
      />
    </div>
  );
};

function getOptsFees(priceList: DeliveryFee[]) {
  return priceList.map((fee) => ({
    value: getId(fee),
    label: fee.name ?? `Zone ${getId(fee)}`,
  }));
}

function getId(fee: DeliveryFee): string {
  return fee.id ?? uuidv4();
}

export default PriceListSelect;
