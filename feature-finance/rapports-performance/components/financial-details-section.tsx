'use client';

import { Card, CardBody } from '@heroui/react';
import { IFinancialDetails } from '@/feature-finance/rapports-performance/types/performance.type';

interface FinancialDetailsSectionProps {
  financialDetails?: IFinancialDetails;
}

export function FinancialDetailsSection({ financialDetails }: FinancialDetailsSectionProps) {
  return (
    <Card>
      <CardBody className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Détails Financiers</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Montant total des commandes</span>
            <span className="font-semibold text-gray-900">
              {financialDetails?.totalOrderAmount
                ? `${financialDetails.totalOrderAmount.toLocaleString()} FCFA`
                : '0 FCFA'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Frais de livraison collectés</span>
            <span className="font-semibold text-gray-900">
              {financialDetails?.deliveryFeesCollected
                ? `${financialDetails.deliveryFeesCollected.toLocaleString()} FCFA`
                : '0 FCFA'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Frais de service Turbo Delivery (10%)</span>
            <span className="font-semibold text-orange-600">
              {financialDetails?.turboDeliveryServiceFees
                ? `${financialDetails.turboDeliveryServiceFees.toLocaleString()} FCFA`
                : '0 FCFA'}
            </span>
          </div>
          <div className="flex justify-between items-center py-4">
            <span className="text-gray-700 font-medium">Revenu net du partenaire</span>
            <span className="text-xl font-bold text-green-600">
              {financialDetails?.partnerNetRevenue
                ? `${financialDetails.partnerNetRevenue.toLocaleString()} FCFA`
                : '0 FCFA'}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
