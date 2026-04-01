'use client';

import { Download } from 'lucide-react';
import { Card, CardBody, Button } from '@heroui/react';
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
    <div className="mb-6 bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-red-600">Rapport de Performance</h1>
            <p className="text-sm text-gray-500 mt-1">Restaurant {selectedRestaurant || 'Tous'}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-5 w-64 py-1.5 bg-red-50 text-red-600 rounded-lg">
            </div>
              <RestaurantSelect value={restaurantId} onChange={onRestaurantChange} />

            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <DateFilterInput
                filters={{ debut, fin }}
                handleDateChange={onDateChange}
                variant="outline"
              />
            </div>

            <Button
              color="primary"
              className="bg-orange-500"
              onPress={onExportPdf}
              startContent={<Download className="w-4 h-4" />}
            >
              Exporter PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
