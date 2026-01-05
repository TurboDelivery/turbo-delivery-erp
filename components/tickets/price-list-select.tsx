import { getPriceListByRestaurant } from '@/src/price-list/price-list.action';
import { PaginatedResponse } from '@/types';
import { DeliveryFee } from '@/types/delivery-fee.model';
import Select, { SingleValue } from 'react-select';
import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '@/types/bon-livraison.model';

type PriceListSelectProps = {
  restaurantID: string;
  handleChange: (id: string, field: keyof Ticket, value: string) => void;
};

const PriceListSelect = ({ restaurantID, handleChange }: PriceListSelectProps) => {
  const [priceList, setPriceList] = useState<DeliveryFee[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchPriceList = async () => {
      setLoading(true);
      setError(null);
      const result: PaginatedResponse<DeliveryFee> | null = await getPriceListByRestaurant(restaurantID, 0, 100);

      if (result) {
        setPriceList(result.content); // ou result.data selon ta structure
      } else {
        setError('Impossible de récupérer la liste des prix.');
      }

      setLoading(false);
    };

    fetchPriceList();
  }, [restaurantID]);

  const opts = useMemo(() => getOptsFees(priceList), [priceList]);
  const onChange = (option: SingleValue<{ value: string; label: string }>) => {
    setSelectedFeeId(option?.value ?? null);
    const prix = priceList.find((fee) => getId(fee) == option?.value)?.commission ?? 0;
    console.log('Selected PriceList ID:', option?.value, 'with fee:', prix);
    handleChange(priceList[0]?.id ?? '', 'zoneId', prix.toString());
  };

  return (
    <div>
      <Select
        options={opts}
        value={opts.find((o) => o.value == selectedFeeId) ?? null}
        onChange={(option) => onChange(option)}
        placeholder="Sélectionner une zone"
        isClearable
        className="text-xs rounded px-2 py-1"
        classNamePrefix="react-select"
      />
    </div>
  );
};

function getOptsFees(priceList: DeliveryFee[]) {
  return priceList.map((fee) => ({
    value: getId(fee),
    label: fee.zone ?? `Zone ${getId(fee)}`,
  }));
}

function getId(fee: DeliveryFee): string {
  return fee.id ?? uuidv4();
}

export default PriceListSelect;
