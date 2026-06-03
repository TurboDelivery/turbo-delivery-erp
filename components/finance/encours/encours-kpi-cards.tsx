'use client';

import { Card, CardBody } from '@heroui/react';
import { PiggyBank, ReceiptText, Store, TrendingUp, Users, Wallet } from 'lucide-react';
import { IEncoursReleve, computeKpis, formatFcfa } from '@/features/encours';

/** Bandeau de 4 indicateurs (KPI) qui se recalculent selon les filtres (§5). */
export function EncoursKpiCards({ releve }: { releve: IEncoursReleve }) {
  const { facture, reste, deductions, taux } = computeKpis(releve);
  const tauxTone =
    taux >= 70 ? 'text-emerald-600' : taux >= 40 ? 'text-amber-600' : 'text-rose-600';

  const cards = [
    {
      label: 'Total facturé',
      value: formatFcfa(facture),
      icon: ReceiptText,
      iconWrap: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Reste à payer · Encours',
      value: formatFcfa(reste),
      icon: Wallet,
      hero: true,
    },
    {
      label: 'Avances & déductions',
      value: formatFcfa(deductions),
      icon: PiggyBank,
      iconWrap: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Taux de recouvrement',
      value: `${taux} %`,
      icon: TrendingUp,
      iconWrap: 'bg-emerald-50 text-emerald-600',
      valueClass: tauxTone,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card
            key={c.label}
            shadow="none"
            className={
              c.hero
                ? 'border border-primary/30 bg-primary/5'
                : 'border border-default-200 bg-content1'
            }
          >
            <CardBody className="gap-2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-default-500">
                  {c.label}
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    c.hero ? 'bg-primary/15 text-primary' : c.iconWrap
                  }`}
                >
                  <c.icon className="h-4 w-4" />
                </span>
              </div>
              <span
                className={`font-bold tabular-nums tracking-tight ${
                  c.hero ? 'text-2xl text-primary' : `text-xl ${c.valueClass ?? 'text-foreground'}`
                }`}
              >
                {c.value}
              </span>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-default-500">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {releve.nbPartenaires} partenaire
          {releve.nbPartenaires > 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1">
          <Store className="h-3.5 w-3.5" /> {releve.nbStores} point{releve.nbStores > 1 ? 's' : ''} de
          vente
        </span>
      </div>
    </div>
  );
}
