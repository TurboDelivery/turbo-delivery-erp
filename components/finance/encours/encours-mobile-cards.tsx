'use client';

import { Card, Chip } from '@heroui-v3/react';

import { cycleLabel, formatFcfa, IEncoursReleve } from '@/features/encours';
import { formatPeriodeFactureeEncours } from '@/lib/finance/periode-facturee';

const STATUT_COLOR: Record<string, 'danger' | 'default' | 'success' | 'warning'> = {
  'En cours': 'default',
  'En retard': 'danger',
  Partiel: 'warning',
  Payé: 'success',
};

/**
 * Vue mobile (cartes tactiles) du relevé ENCOURS — détail facture par facture par
 * partenaire.
 *
 * <p>Le cycle portait une couleur — `secondary` en quinzaine, `primary` en hebdomadaire —
 * alors que c'est une étiquette de périodicité, pas un état. Sur ce relevé la couleur dit
 * le statut de paiement, et rien d'autre. La déduction s'affichait en `text-amber-700` et
 * le total général en `bg-primary/5 text-primary` : des teintes de l'ancienne palette.</p>
 */
export function EncoursMobileCards({ releve }: { releve: IEncoursReleve }) {
  if (!releve.partenaires?.length) {
    return (
      <Card>
        <Card.Content className="items-center py-10 text-center">
          <p className="text-sm text-muted">Aucun reste à payer pour cette sélection.</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {releve.partenaires.map((p, pi) => (
        <Card key={`${p.groupe}-${pi}`}>
          <Card.Content className="gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-semibold text-foreground">{p.groupe}</span>
                <Chip size="sm" variant="soft">
                  <Chip.Label>{cycleLabel(p.cycle)}</Chip.Label>
                </Chip>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                {formatFcfa(p.sousTotalReste)}
              </span>
            </div>

            {p.stores.map((s, si) => (
              <div key={`${s.store}-${si}`}>
                <div className="flex items-center justify-between text-xs font-medium text-muted">
                  <span className="truncate">{s.store}</span>
                  <span className="shrink-0 tabular-nums">reste {formatFcfa(s.reste)}</span>
                </div>
                <div className="mt-1 divide-y divide-separator rounded-lg border border-separator">
                  {s.factures.map((f, fi) => (
                    <div
                      className="flex items-center justify-between gap-2 px-2.5 py-2 text-sm"
                      key={`${f.libelle}-${fi}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {formatPeriodeFactureeEncours(releve.annee, f.mois, p.cycle, f.libelle)}
                        </p>
                        <p className="text-xs tabular-nums text-muted">
                          payé {formatFcfa(f.acompte)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatFcfa(f.solde)}
                        </span>
                        <Chip color={STATUT_COLOR[f.statut] ?? 'default'} size="sm" variant="soft">
                          <Chip.Label>{f.statut}</Chip.Label>
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Boolean(p.deduction) && (
              <p className="text-right text-xs tabular-nums text-muted">
                Déduction : - {formatFcfa(p.deduction)}
              </p>
            )}
          </Card.Content>
        </Card>
      ))}

      <Card className="bg-surface-secondary">
        <Card.Content className="flex-row items-center justify-between">
          <span className="font-bold text-foreground">TOTAL GÉNÉRAL</span>
          <span className="text-lg font-bold tabular-nums text-foreground">
            {formatFcfa(releve.totalReste)}
          </span>
        </Card.Content>
      </Card>
    </div>
  );
}
