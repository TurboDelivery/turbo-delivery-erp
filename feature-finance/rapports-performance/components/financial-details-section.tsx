'use client';

import { Card, CardBody } from '@heroui/react';
import { IFinancialDetails } from '@/feature-finance/rapports-performance/types/performance.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

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
            <span className="text-gray-600">Grâce à nos livraisons, le partenaire a vendu </span>
            <span className="font-semibold text-gray-900">
              {financialDetails?.totalOrderAmount
                ? formatCFA(Math.round(financialDetails.totalOrderAmount))
                : '0 FCFA'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Les frais de livraison générés sur l'ensemble des courses ce mois</span>
            <span className="font-semibold text-gray-900">
              {financialDetails?.deliveryFeesCollected
                ? formatCFA(Math.round(financialDetails.deliveryFeesCollected))
                : '0 FCFA'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Frais de service TURBO DELIVERY obtenu</span>
            <span className="font-semibold text-orange-600">
              {financialDetails?.turboDeliveryServiceFees
                ? formatCFA(Math.round(financialDetails.turboDeliveryServiceFees))
                : '0 FCFA'}
            </span>
          </div>
          <div className="flex justify-between items-center py-4">
            <span className="text-gray-700 font-medium">Facture total à regler au compte du mois en cours </span>
            <span className="text-xl font-bold text-green-600">
              {financialDetails?.totalFacture
                ? formatCFA(Math.round(financialDetails.totalFacture))
                : '0 FCFA'}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
