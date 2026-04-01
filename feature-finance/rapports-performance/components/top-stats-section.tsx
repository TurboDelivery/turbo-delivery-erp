'use client';

import { Package, DollarSign, CheckCircle } from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { IMainKPIs } from '@/feature-finance/rapports-performance/types/performance.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { formatNumber } from '@/utils/formatNumber';

interface TopStatsSectionProps {
  mainKPIs?: IMainKPIs;
}

export function TopStatsSection({ mainKPIs }: TopStatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardBody className="p-6 bg-red-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Nombre de Livraisons</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{formatNumber(mainKPIs?.totalDeliveries ?? 0)}</p>
              <p className="text-sm text-gray-500">Moyenne: 12.1 livraisons/jour</p>
              <p className="text-sm text-green-600 font-medium mt-1">+12% vs mois précédent</p>
            </div>
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Valeur Totale des Commandes</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {mainKPIs?.totalOrderValue ? `${(mainKPIs.totalOrderValue / 1000000).toFixed(2)}M` : '0'}
              </p>
              <p className="text-sm text-gray-500">
                {mainKPIs?.totalOrderValue ? formatCFA(Math.round(mainKPIs.totalOrderValue)) : '0 FCFA'}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-6 bg-blue-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Chiffre d'Affaires</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {mainKPIs?.chiffreAffaires ? `${(mainKPIs.chiffreAffaires / 1000000).toFixed(2)}M` : '0'}
              </p>
              <p className="text-sm text-gray-500">
                {mainKPIs?.chiffreAffaires ? formatCFA(Math.round(mainKPIs.chiffreAffaires)) : '0 FCFA'}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-6 bg-green-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Taux de Succès</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {mainKPIs?.successRate ? `${mainKPIs.successRate.toFixed(1)}%` : '0%'}
              </p>
              <p className="text-sm text-gray-500">Livraisons sans litige</p>
            </div>
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
