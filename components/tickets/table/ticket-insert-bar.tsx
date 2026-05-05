'use client';

import React from 'react';
import Select from 'react-select';
import { Plus } from 'lucide-react';

interface Option { value: string; label: string }

interface InsertState {
  insertCount: number;
  insertLivreurId: string;
  insertRestaurantId: string;
  insertDate: string;
  setInsertCount: (v: number) => void;
  setInsertLivreurId: (v: string) => void;
  setInsertRestaurantId: (v: string) => void;
  setInsertDate: (v: string) => void;
}

interface TicketInsertBarProps {
  livreurOptions: Option[];
  restaurantOptions: Option[];
  insertState: InsertState;
  onInsert: () => void;
  canCreate: boolean;
}

export function TicketInsertBar({ livreurOptions, restaurantOptions, insertState, onInsert, canCreate }: TicketInsertBarProps) {
  const { insertCount, insertLivreurId, insertRestaurantId, insertDate, setInsertCount, setInsertLivreurId, setInsertRestaurantId, setInsertDate } = insertState;

  const selectStyles = {
    control: (base: object) => ({ ...base, minHeight: '36px', height: '36px', width: '100%' }),
    valueContainer: (base: object) => ({ ...base, height: '36px', padding: '0 8px' }),
    indicatorsContainer: (base: object) => ({ ...base, height: '36px' }),
  };

  return (
    <div className="w-full my-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        <div className="w-full">
          <label className="block text-xs mb-1">Restaurant</label>
          <Select
            options={restaurantOptions}
            value={restaurantOptions.find((o) => o.value === insertRestaurantId) ?? null}
            onChange={(opt) => setInsertRestaurantId(opt?.value ?? '')}
            placeholder="Restaurant"
            isClearable
            className="text-xs w-full"
            classNamePrefix="react-select"
            styles={selectStyles}
          />
        </div>
        <div className="w-full">
          <label className="block text-xs mb-1">Livreur</label>
          <Select
            options={livreurOptions}
            value={livreurOptions.find((o) => o.value === insertLivreurId) ?? null}
            onChange={(opt) => setInsertLivreurId(opt?.value ?? '')}
            placeholder="Livreur"
            isClearable
            className="text-xs w-full"
            classNamePrefix="react-select"
            styles={selectStyles}
          />
        </div>
        <div className="w-full">
          <label className="block text-xs mb-1">Date</label>
          <input type="date" value={insertDate} onChange={(e) => setInsertDate(e.target.value)} className="h-9 w-full px-2 text-xs border border-gray-300 rounded-md" />
        </div>
        <div className="w-full">
          <label className="block text-xs mb-1">Nb lignes</label>
          <input
            type="number"
            min={1}
            value={insertCount}
            onChange={(e) => setInsertCount(Number(e.target.value))}
            className="h-9 w-full px-2 text-xs text-center border border-gray-300 rounded-md"
          />
        </div>
        <div className="w-full">
          <label className="block text-xs mb-1 invisible">Action</label>
          <button
            disabled={!canCreate}
            onClick={onInsert}
            className="h-9 w-full bg-green-500 text-white rounded flex items-center justify-center gap-1 text-xs hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" /> Insérer
          </button>
        </div>
      </div>
    </div>
  );
}
