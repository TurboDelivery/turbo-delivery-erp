'use client';

import { Card, CardBody } from '@/components/heroui';
import { IFinancialDetails } from '@/features/rapports-performance/types/performance.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { FinancialDetailRow } from '@/features/rapports-performance/components/financial-detail-row';

interface FinancialDetailsSectionProps {
  financialDetails?: IFinancialDetails;
}

interface FinancialDetailItem {
  label: string;
  value: number | undefined;
  withBorder?: boolean;
  labelClassName?: string;
  valueClassName?: string;
  rowClassName?: string;
}

function formatFinancialAmount(value?: number): string {
  if (!value) {
    return '0 FCFA';
  }

  return formatCFA(Math.round(value));
}

export function FinancialDetailsSection({ financialDetails }: FinancialDetailsSectionProps) {
  const detailItems: FinancialDetailItem[] = [
    {
      label: 'Grace a nos livraisons, le partenaire a vendu',
      value: financialDetails?.totalOrderAmount,
      withBorder: true,
    },
    {
      label: "Les frais de livraison generes sur l'ensemble des courses ce mois",
      value: financialDetails?.deliveryFeesCollected,
      withBorder: true,
    },
    {
      label: 'Frais de service TURBO DELIVERY obtenu',
      value: financialDetails?.turboDeliveryServiceFees,
      withBorder: true,
      valueClassName: 'font-semibold text-orange-600',
    },
    {
      label: 'Facture total a regler au compte du mois en cours',
      value: financialDetails?.totalFacture,
      rowClassName: 'py-4',
      labelClassName: 'text-foreground font-medium',
      valueClassName: 'text-xl font-bold text-green-600',
    },
  ];

  return (
    <Card>
      <CardBody className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Détails Financiers</h2>
        <div className="space-y-4">
          {detailItems.map((item) => (
            <FinancialDetailRow
              key={item.label}
              label={item.label}
              value={formatFinancialAmount(item.value)}
              withBorder={item.withBorder}
              rowClassName={item.rowClassName}
              labelClassName={item.labelClassName}
              valueClassName={item.valueClassName}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
