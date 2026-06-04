'use client';

import { Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { IEncoursReleve, cycleLabel, formatFcfa } from '@/features/encours';
import { formatPeriodeFactureeEncours } from '@/lib/finance/periode-facturee';

const STATUT_COLOR: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  Payé: 'success',
  Partiel: 'warning',
  'En retard': 'danger',
  'En cours': 'default',
};

function cycleColor(c: string): 'secondary' | 'primary' | 'default' {
  if (c === 'QUINZAINE') return 'secondary';
  if (c === 'HEBDOMADAIRE') return 'primary';
  return 'default';
}

/** Vue mobile (cartes tactiles) du relevé ENCOURS — détail facture par facture par partenaire. */
export function EncoursMobileCards({ releve }: { releve: IEncoursReleve }) {
  if (!releve.partenaires?.length) {
    return (
      <p className="rounded-xl border border-default-200 py-10 text-center text-sm text-default-400">
        Aucun reste à payer pour cette sélection.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {releve.partenaires.map((p, pi) => (
        <Card key={pi} shadow="none" className="border border-default-200">
          <CardHeader className="flex items-center justify-between gap-2 pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold">{p.groupe}</span>
              <Chip size="sm" variant="flat" color={cycleColor(p.cycle)} className="h-5 shrink-0">
                {cycleLabel(p.cycle)}
              </Chip>
            </div>
            <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
              {formatFcfa(p.sousTotalReste)}
            </span>
          </CardHeader>
          <CardBody className="gap-3 pt-0">
            {p.stores.map((s, si) => (
              <div key={si}>
                <div className="flex items-center justify-between text-xs font-medium text-default-500">
                  <span className="truncate">{s.store}</span>
                  <span className="shrink-0">reste {formatFcfa(s.reste)}</span>
                </div>
                <div className="mt-1 divide-y divide-default-100 rounded-lg border border-default-100">
                  {s.factures.map((f, fi) => (
                    <div key={fi} className="flex items-center justify-between gap-2 px-2.5 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {formatPeriodeFactureeEncours(releve.annee, f.mois, p.cycle, f.libelle)}
                        </p>
                        <p className="text-xs text-default-400">payé {formatFcfa(f.acompte)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="font-semibold tabular-nums">{formatFcfa(f.solde)}</span>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={STATUT_COLOR[f.statut] ?? 'default'}
                          className="h-5"
                        >
                          {f.statut}
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!!p.deduction && (
              <p className="text-right text-xs text-amber-700">Déduction : - {formatFcfa(p.deduction)}</p>
            )}
          </CardBody>
        </Card>
      ))}

      <Card shadow="none" className="border border-primary/30 bg-primary/5">
        <CardBody className="flex flex-row items-center justify-between p-4">
          <span className="font-bold text-primary">TOTAL GÉNÉRAL</span>
          <span className="text-lg font-bold tabular-nums text-primary">{formatFcfa(releve.totalReste)}</span>
        </CardBody>
      </Card>
    </div>
  );
}
