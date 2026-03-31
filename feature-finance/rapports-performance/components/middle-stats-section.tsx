'use client';

import { Clock, TrendingUp, Box } from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { ISecondaryKPIs } from '@/feature-finance/rapports-performance/types/performance.type';

interface MiddleStatsSectionProps {
  secondaryKPIs?: ISecondaryKPIs;
}

export function MiddleStatsSection({ secondaryKPIs }: MiddleStatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardBody className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Temps Moyen de Livraison</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {secondaryKPIs?.averageDeliveryTime ? `${secondaryKPIs.averageDeliveryTime} min` : '0 min'}
              </p>
              <p className="text-xs text-gray-500">De la récupération à la remise</p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Croissance Mensuelle</p>
              <p className="text-2xl font-bold text-green-600 mb-1">
                {secondaryKPIs?.monthlyGrowth ? `${secondaryKPIs.monthlyGrowth.toFixed(1)}%` : '0%'}
              </p>
              <p className="text-xs text-gray-500">Par rapport au mois précédent</p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Articles par Commande</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {secondaryKPIs?.averageItemsPerOrder ?? 0}
              </p>
              <p className="text-xs text-gray-500">Moyenne par livraison</p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Box className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
