'use client';

import { AlertCircle } from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { IMainKPIs, ISecondaryKPIs } from '@/features/rapports-performance/types/performance.type';
import { formatCfa, formatNombre } from '@/utils/format.utils';

interface PerformanceSummarySectionProps {
  mainKPIs?: IMainKPIs;
  secondaryKPIs?: ISecondaryKPIs;
  selectedRestaurant: string;
}

export function PerformanceSummarySection({
  mainKPIs,
  secondaryKPIs,
  selectedRestaurant,
}: PerformanceSummarySectionProps) {
  return (
    <Card>
      <CardBody className="p-6 bg-orange-50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Résumé de Performance</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {mainKPIs && secondaryKPIs ? (
                <>
                  Grâce à Turbo Delivery, Restaurant {selectedRestaurant || 'Tous'} a réalisé{' '}
                  {formatNombre(mainKPIs.totalDeliveries)} livraisons pour un montant total de{' '}
                  {formatCfa(Math.round(mainKPIs.totalOrderValue))} durant la période
                  sélectionnée. Le temps moyen de livraison est de {secondaryKPIs.averageDeliveryTime}{' '}
                  minutes avec un taux de succès de {mainKPIs.successRate.toFixed(1)}%.
                </>
              ) : (
                <>Chargement des données de performance...</>
              )}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
