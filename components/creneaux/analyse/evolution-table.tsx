'use client';

import { Card, Chip, Table } from '@heroui-v3/react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface EvolutionRow {
  ecart: number;
  mois: string;
  previsionnel: number;
  reel: number;
  tendance: 'down' | 'up';
}

interface EvolutionTableProps {
  data: EvolutionRow[];
}

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { id: 'mois', libelle: 'Mois' },
  { id: 'previsionnel', libelle: 'Taux prévisionnel' },
  { id: 'reel', libelle: 'Taux réel' },
  { id: 'ecart', libelle: 'Écart' },
  { id: 'tendance', libelle: 'Tendance' },
] as const;

/**
 * L'écart entre prévisionnel et réel.
 *
 * <p>Il était peint en rouge QUEL QUE SOIT SON SIGNE : un mois où le réel dépasse le
 * prévisionnel — donc une bonne nouvelle — s'affichait comme une alerte. La couleur suit
 * le signe, ou se tait quand l'écart est nul.</p>
 */
function EcartChip({ ecart }: { ecart: number }) {
  const ton = ecart > 0 ? 'success' : ecart < 0 ? 'danger' : 'default';
  return (
    <Chip color={ton} size="sm" variant="soft">
      <Chip.Label className="tabular-nums">
        {ecart > 0 ? '+' : ''}
        {ecart}%
      </Chip.Label>
    </Chip>
  );
}

function Tendance({ tendance }: { tendance: 'down' | 'up' }) {
  return tendance === 'down' ? (
    <TrendingDown aria-hidden="true" className="size-4 text-danger-soft-foreground" />
  ) : (
    <TrendingUp aria-hidden="true" className="size-4 text-success-soft-foreground" />
  );
}

export function EvolutionTable({ data }: EvolutionTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Évolution mensuelle</h3>
        <p className="text-sm text-muted">Comparaison des derniers mois</p>
      </div>

      {/* Table — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Évolution mensuelle">
                <Table.Header>
                  {COLONNES.map((c) => (
                    <Table.Column id={c.id} isRowHeader={c.id === 'mois'} key={c.id}>
                      {c.libelle}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <p className="py-8 text-center text-sm text-muted">Aucune évolution</p>
                  )}
                >
                  {data.map((row) => (
                    <Table.Row id={row.mois} key={row.mois}>
                      <Table.Cell className="font-medium">{row.mois}</Table.Cell>
                      <Table.Cell className="tabular-nums">{row.previsionnel}%</Table.Cell>
                      <Table.Cell className="tabular-nums">{row.reel}%</Table.Cell>
                      <Table.Cell>
                        <EcartChip ecart={row.ecart} />
                      </Table.Cell>
                      <Table.Cell>
                        <Tendance tendance={row.tendance} />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      {/* Mobile — cartes tactiles (mêmes données que le tableau) */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aucune évolution</p>
        ) : (
          data.map((row) => (
            <Card key={row.mois}>
              <Card.Content className="gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{row.mois}</span>
                  <Tendance tendance={row.tendance} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Taux prévisionnel</span>
                  <span className="text-right text-sm tabular-nums text-foreground">
                    {row.previsionnel}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Taux réel</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{row.reel}%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Écart</span>
                  <EcartChip ecart={row.ecart} />
                </div>
              </Card.Content>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
