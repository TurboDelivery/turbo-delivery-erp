'use client';

import { Download } from 'lucide-react';
import { Button, Card } from '@heroui-v3/react';
import { DateRange } from 'react-day-picker';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import DateFilterInput from '@/components/finance/date-filter-input';

interface PerformanceHeaderProps {
  selectedRestaurant: string;
  restaurantId?: string;
  debut: Date | undefined;
  fin: Date | undefined;
  onDateChange: (value: DateRange | undefined) => void;
  onRestaurantChange: (value?: string) => void;
  onExportPdf: () => void;
}

export function PerformanceHeader({
  selectedRestaurant,
  restaurantId,
  debut,
  fin,
  onDateChange,
  onRestaurantChange,
  onExportPdf,
}: PerformanceHeaderProps) {
  return (
    <div className="mb-6 bg-surface rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Rapport de Performance</h1>
            <p className="text-sm text-muted mt-1">Restaurant {selectedRestaurant || 'Tous'}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-5 w-64 py-1.5 bg-red-50 text-red-600 rounded-lg">
            </div>
              <RestaurantSelect value={restaurantId} onChange={onRestaurantChange} />

            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary rounded-lg">
              <DateFilterInput
                filters={{ debut, fin }}
                handleDateChange={onDateChange}
                variant="outline"
              />
            </div>

            {/*
             * Le bouton portait `color="primary"` ET `bg-orange-500` : deux couleurs
             * contradictoires posees sur le meme element, dont l'orange gagnait — une
             * teinte qui n'appartient a aucun theme du projet.
             */}
            <Button onPress={onExportPdf} variant="primary">
              <Download aria-hidden="true" className="size-4" />
              Exporter PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
